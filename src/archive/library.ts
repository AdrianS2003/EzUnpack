import { Directory, File, Paths } from 'expo-file-system';

import { archiveFormatFromType, archiveFormatOf, extensionOf } from '@/archive/kinds';
import { folderFor } from '@/archive/unpack';
import type { Archive, ArchiveSource } from '@/data/archives';

/**
 * Our own copy of every archive the user has handed us.
 *
 * This exists because of how Android actually delivers files: WhatsApp keeps
 * downloaded documents in its own scoped folder, which we may not browse, and
 * the `content://` URI we receive is only valid while the intent lives. So the
 * first thing we do with any incoming archive is copy it here. After that it is
 * ours: it survives restarts, and listing this folder rebuilds the whole feed
 * without needing permission to scan the phone.
 */
export const LIBRARY_FOLDER = 'EzUnpack';
export const ARCHIVES_FOLDER = 'Archives';

function archivesDirectory(): Directory {
  const dir = new Directory(Paths.document, LIBRARY_FOLDER, ARCHIVES_FOLDER);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Strips anything that could escape the folder or upset the filesystem. */
function safeName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, '_').replace(/^\.+/, '');
  return cleaned || 'archive';
}

/** Picks a free filename so importing the same archive twice keeps both. */
function freeFile(folder: Directory, name: string): File {
  const candidate = new File(folder, name);
  if (!candidate.exists) return candidate;

  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let n = 2; n < 1000; n++) {
    const next = new File(folder, `${stem} (${n})${ext}`);
    if (!next.exists) return next;
  }
  return new File(folder, `${stem}-${Date.now()}${ext}`);
}

function toArchive(file: File, source: ArchiveSource, receivedAt: number): Archive {
  const name = file.name;
  const format = archiveFormatOf(name);
  return {
    id: file.uri,
    name,
    ext: (format ?? extensionOf(name)).toUpperCase() || 'FILE',
    uri: file.uri,
    sizeBytes: file.size,
    source,
    receivedAt,
    files: [],
  };
}

/**
 * Finds an archive we already hold with the same contents as `candidate`.
 *
 * Names cannot be trusted for this. Even with the provider's display name
 * recovered, the same archive can arrive twice under two spellings — forwarded
 * on once and downloaded once, or saved a second time as "file (1).rar".
 * Comparing bytes is the only honest test. Size is checked first because it is
 * free; md5 is only computed for the rare file that matches on size.
 *
 * `candidate` is the staged copy in the cache, so nothing here can match it
 * against itself.
 */
function findTwin(candidate: File): File | null {
  const size = candidate.size;
  if (size <= 0) return null;

  const sameSize = archivesDirectory()
    .list()
    .filter((entry): entry is File => entry instanceof File)
    .filter((file) => file.size === size);

  if (sameSize.length === 0) return null;

  const hash = candidate.md5;
  if (!hash) return null;

  return sameSize.find((file) => file.md5 === hash) ?? null;
}

/** Scratch folder for an incoming file whose real name we do not know yet. */
function stagingDirectory(): Directory {
  const dir = new Directory(Paths.cache, 'ezunpack-import');
  try {
    if (dir.exists) dir.delete();
  } catch {
    // A leftover scratch folder is not worth failing over — the copy below
    // still lands, and the worst case is one stale file left in the cache.
  }
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/**
 * The staged file's name, with an archive extension put back when it has none.
 *
 * A few providers report a display name with no extension at all. That name
 * would work for the rest of the session, but `listArchives` recognises
 * archives by extension, so after a restart the archive would quietly vanish
 * from the feed. The provider's own MIME type is the second opinion that stops
 * that happening.
 */
function named(name: string, mimeType: string): string {
  if (archiveFormatOf(name)) return name;
  const format = archiveFormatFromType(mimeType);
  return format ? `${name}.${format}` : name;
}

/**
 * Copies an incoming archive into our folder and returns it.
 *
 * The copy lands in the cache first, for two reasons.
 *
 * It is the only way to learn what the file is called. `File.name` is
 * `basename(uri)` and nothing more, so for a `content://` URI it returns the
 * provider's internal identifier — which is precisely what WhatsApp hands over,
 * a long run of digits and letters. The real name lives inside the provider
 * under `DISPLAY_NAME`, and copying into a *folder* rather than onto a filename
 * we picked is what makes expo-file-system go and ask for it.
 *
 * It also gives us something we can hash. Incoming files arrive as `content://`
 * URIs where md5 is not always available, and the duplicate check needs real
 * bytes. Hashing here means that when we already hold this archive, the folder
 * the user sees is never touched at all.
 */
export function importArchive(uri: string, source: ArchiveSource, fallbackName?: string): Archive {
  const staging = stagingDirectory();

  try {
    const incoming = new File(uri);
    // Asked before the copy: afterwards we hold a plain cache file, and its
    // type would be guessed from a name that may not have an extension.
    const mimeType = incoming.type;
    incoming.copySync(staging);

    const staged = staging.list().find((entry): entry is File => entry instanceof File);
    if (!staged) throw new Error('the incoming file did not arrive');

    const twin = findTwin(staged);
    if (twin) return toArchive(twin, source, twin.lastModified ?? Date.now());

    const target = freeFile(archivesDirectory(), safeName(fallbackName ?? named(staged.name, mimeType)));
    staged.moveSync(target);

    return toArchive(target, source, Date.now());
  } finally {
    try {
      if (staging.exists) staging.delete();
    } catch {
      // Cache is the system's to reclaim.
    }
  }
}

/**
 * Everything we have been given, newest first. Called on launch to build the
 * feed — the source is unknown for older files, so they read as "opened".
 */
export function listArchives(): Archive[] {
  const entries = archivesDirectory().list();
  const archives: Archive[] = [];

  for (const entry of entries) {
    if (!(entry instanceof File)) continue;
    if (!archiveFormatOf(entry.name)) continue;
    archives.push(toArchive(entry, 'opened', entry.lastModified ?? 0));
  }

  return archives.sort((a, b) => b.receivedAt - a.receivedAt);
}

/**
 * Removes everything the app holds for one archive: the unpacked files and our
 * own copy of the archive itself. The original in WhatsApp or Downloads is
 * untouched, and so is the gallery — the photos and videos were handed to the
 * phone's own Photos app, which is where the user has been told to look for
 * them and where they must stay even when EzUnpack is gone.
 *
 * The two deletions are attempted independently: if one fails, the other should
 * still free its space. A half-removed archive is better than a stuck one, and
 * the card disappears from the feed either way.
 */
export function deleteArchive(archive: Archive): void {
  let failure: unknown = null;

  try {
    const folder = folderFor(archive);
    if (folder.exists) folder.delete();
  } catch (error) {
    failure = error;
  }

  try {
    const file = new File(archive.uri);
    if (file.exists) file.delete();
  } catch (error) {
    failure ??= error;
  }

  if (failure) throw failure;
}
