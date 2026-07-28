package expo.modules.archivenative

import android.net.Uri
import java.io.File

/**
 * The JNI surface. Kept apart from the Expo module so the native symbol names
 * stay stable no matter how the module definition is refactored.
 */
object ArchiveBridge {
  init {
    System.loadLibrary("archive_native")
  }

  external fun libarchiveVersion(): String

  /** JSON array of `{ path, size, dir }`. */
  external fun listEntries(path: String): String

  /** JSON array of the relative paths written into `destination`. */
  external fun extractAll(path: String, destination: String): String

  /**
   * JavaScript passes `file://` URIs; libarchive wants an ordinary path.
   * Going through [Uri] rather than trimming the prefix keeps percent-encoded
   * characters — spaces and diacritics are common in file names here — intact.
   */
  fun toFilePath(uriOrPath: String): String {
    if (!uriOrPath.startsWith("file://")) return uriOrPath
    return Uri.parse(uriOrPath).path ?: uriOrPath.removePrefix("file://")
  }

  fun ensureDirectory(path: String): String {
    val directory = File(toFilePath(path))
    directory.mkdirs()
    return directory.absolutePath
  }
}
