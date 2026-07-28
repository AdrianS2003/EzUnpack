#include <jni.h>

#include <archive.h>
#include <archive_entry.h>
#include <sys/stat.h>

#include <string>
#include <vector>

/**
 * Bridge between Kotlin and libarchive.
 *
 * Results cross the JNI boundary as JSON strings rather than as Java objects.
 * Building object arrays through JNI is a lot of fragile, hand-written glue for
 * data that JavaScript is going to parse anyway; a string keeps this file small
 * enough to read in one sitting.
 */

namespace {

void throwError(JNIEnv *env, const std::string &message) {
  jclass cls = env->FindClass("java/lang/RuntimeException");
  if (cls != nullptr) {
    env->ThrowNew(cls, message.c_str());
  }
}

std::string jsonEscape(const char *raw) {
  std::string out;
  if (raw == nullptr) return out;
  for (const char *p = raw; *p != '\0'; ++p) {
    unsigned char c = static_cast<unsigned char>(*p);
    switch (c) {
      case '"': out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n"; break;
      case '\r': out += "\\r"; break;
      case '\t': out += "\\t"; break;
      default:
        if (c < 0x20) {
          char buf[7];
          snprintf(buf, sizeof(buf), "\\u%04x", c);
          out += buf;
        } else {
          out += static_cast<char>(c);
        }
    }
  }
  return out;
}

/**
 * Rejects entry names that would write outside the destination folder.
 *
 * An archive is untrusted input: an entry called `../../databases/app.db` is a
 * real and well known attack. Anything absolute, or containing a `..` segment,
 * is refused rather than sanitised, because a silently rewritten path is harder
 * to reason about than a skipped file.
 */
bool isSafeRelativePath(const std::string &path) {
  if (path.empty()) return false;
  if (path.front() == '/' || path.front() == '\\') return false;
  if (path.size() > 1 && path[1] == ':') return false;

  size_t start = 0;
  while (start <= path.size()) {
    size_t slash = path.find_first_of("/\\", start);
    std::string segment =
        path.substr(start, slash == std::string::npos ? std::string::npos : slash - start);
    if (segment == "..") return false;
    if (slash == std::string::npos) break;
    start = slash + 1;
  }
  return true;
}

/** mkdir -p, for the folders an entry's path implies. */
bool makeParentDirectories(const std::string &fullPath) {
  size_t end = fullPath.find_last_of('/');
  if (end == std::string::npos) return true;

  for (size_t i = 1; i <= end; ++i) {
    if (fullPath[i] != '/' && i != end) continue;
    std::string dir = fullPath.substr(0, i);
    if (dir.empty()) continue;
    if (mkdir(dir.c_str(), 0755) != 0 && errno != EEXIST) return false;
  }
  return true;
}

struct Reader {
  struct archive *handle = nullptr;

  explicit Reader(const char *path) {
    handle = archive_read_new();
    archive_read_support_filter_all(handle);
    archive_read_support_format_all(handle);
    // 64 KB blocks: large enough that a big archive is not read in tiny steps,
    // small enough not to matter on a phone with little free memory.
    if (archive_read_open_filename(handle, path, 65536) != ARCHIVE_OK) {
      error = archive_error_string(handle) ? archive_error_string(handle) : "cannot open archive";
    }
  }

  ~Reader() {
    if (handle != nullptr) {
      archive_read_close(handle);
      archive_read_free(handle);
    }
  }

  std::string error;
};

}  // namespace

extern "C" JNIEXPORT jstring JNICALL
Java_expo_modules_archivenative_ArchiveBridge_libarchiveVersion(JNIEnv *env, jobject /* self */) {
  return env->NewStringUTF(archive_version_details());
}

/** Walks the archive without decompressing anything, returning JSON. */
extern "C" JNIEXPORT jstring JNICALL Java_expo_modules_archivenative_ArchiveBridge_listEntries(
    JNIEnv *env, jobject /* self */, jstring jPath) {
  const char *path = env->GetStringUTFChars(jPath, nullptr);
  Reader reader(path);
  env->ReleaseStringUTFChars(jPath, path);

  if (!reader.error.empty()) {
    throwError(env, reader.error);
    return nullptr;
  }

  std::string out = "[";
  bool first = true;
  struct archive_entry *entry = nullptr;

  while (archive_read_next_header(reader.handle, &entry) == ARCHIVE_OK) {
    const char *name = archive_entry_pathname(entry);
    if (name == nullptr) continue;

    const bool isDirectory = archive_entry_filetype(entry) == AE_IFDIR;
    const la_int64_t size = archive_entry_size(entry);

    if (!first) out += ",";
    first = false;
    out += "{\"path\":\"";
    out += jsonEscape(name);
    out += "\",\"size\":";
    out += std::to_string(static_cast<long long>(size));
    out += ",\"dir\":";
    out += isDirectory ? "true" : "false";
    out += "}";

    archive_read_data_skip(reader.handle);
  }

  out += "]";
  return env->NewStringUTF(out.c_str());
}

/**
 * Extracts everything in a single pass and reports what was written.
 *
 * One pass matters: RAR5 and 7z archives are often "solid", meaning files share
 * one compression stream and reaching the last file requires decompressing all
 * the ones before it. Pulling entries out one at a time would redo that work
 * for every file.
 */
extern "C" JNIEXPORT jstring JNICALL Java_expo_modules_archivenative_ArchiveBridge_extractAll(
    JNIEnv *env, jobject /* self */, jstring jPath, jstring jDestination) {
  const char *path = env->GetStringUTFChars(jPath, nullptr);
  Reader reader(path);
  env->ReleaseStringUTFChars(jPath, path);

  if (!reader.error.empty()) {
    throwError(env, reader.error);
    return nullptr;
  }

  const char *rawDestination = env->GetStringUTFChars(jDestination, nullptr);
  const std::string destination(rawDestination);
  env->ReleaseStringUTFChars(jDestination, rawDestination);

  std::string out = "[";
  bool first = true;
  struct archive_entry *entry = nullptr;
  std::vector<char> buffer(65536);

  while (archive_read_next_header(reader.handle, &entry) == ARCHIVE_OK) {
    const char *name = archive_entry_pathname(entry);
    if (name == nullptr) continue;
    if (archive_entry_filetype(entry) == AE_IFDIR) continue;

    const std::string relative(name);
    if (!isSafeRelativePath(relative)) continue;

    const std::string target = destination + "/" + relative;
    if (!makeParentDirectories(target)) {
      throwError(env, "cannot create folder for " + relative);
      return nullptr;
    }

    FILE *file = fopen(target.c_str(), "wb");
    if (file == nullptr) {
      throwError(env, "cannot write " + relative);
      return nullptr;
    }

    bool failed = false;
    for (;;) {
      const la_ssize_t read = archive_read_data(reader.handle, buffer.data(), buffer.size());
      if (read == 0) break;
      if (read < 0) {
        const char *message = archive_error_string(reader.handle);
        fclose(file);
        throwError(env, message != nullptr ? message : "cannot read " + relative);
        return nullptr;
      }
      if (fwrite(buffer.data(), 1, static_cast<size_t>(read), file) != static_cast<size_t>(read)) {
        failed = true;
        break;
      }
    }
    fclose(file);

    if (failed) {
      throwError(env, "ran out of space writing " + relative);
      return nullptr;
    }

    if (!first) out += ",";
    first = false;
    out += "\"";
    out += jsonEscape(relative.c_str());
    out += "\"";
  }

  out += "]";
  return env->NewStringUTF(out.c_str());
}
