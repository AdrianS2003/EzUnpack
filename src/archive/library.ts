import { Directory, File, Paths } from 'expo-file-system';

import { archiveFormatOf, extensionOf } from '@/archive/kinds';
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
 * Names cannot be trusted for this. WhatsApp hands over its own internal file
 * name — a long string of digits and letters — so the same archive arriving by
 * share and by file picker looks like two unrelated files. Comparing bytes is
 * the only honest test. Size is checked first because it is free; md5 is only
 * computed for the rare file that matches on size.
 */
function findTwin(candidate: File): File | null {
  const size = candidate.size;
  if (size <= 0) return null;

  const sameSize = archivesDirectory()
    .list()
    .filter((entry): entry is File => entry instanceof File)
    .filter((file) => file.uri !== candidate.uri && file.size === size);

  if (sameSize.length === 0) return null;

  const hash = candidate.md5;
  if (!hash) return null;

  return sameSize.find((file) => file.md5 === hash) ?? null;
}

/**
 * Copies an incoming archive into our folder and returns it.
 *
 * The copy happens before the duplicate check on purpose: incoming files often
 * arrive as `content://` URIs, where md5 is not always available, so we first
 * make it an ordinary file we can hash. If it turns out to be one we already
 * hold, the fresh copy is thrown away and the original is returned — the user
 * sees one entry, not the same archive twice under two different names.
 */
export function importArchive(uri: string, source: ArchiveSource, fallbackName?: string): Archive {
  const incoming = new File(uri);
  const name = safeName(fallbackName ?? incoming.name);

  const target = freeFile(archivesDirectory(), name);
  incoming.copySync(target);

  const twin = findTwin(target);
  if (twin) {
    try {
      target.delete();
    } catch {
      // Leaving the duplicate on disk is untidy but not worth failing over.
    }
    return toArchive(twin, source, twin.lastModified ?? Date.now());
  }

  return toArchive(target, source, Date.now());
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

/** Removes our copy. The original in WhatsApp or Downloads is untouched. */
export function forgetArchive(archive: Archive): void {
  const file = new File(archive.uri);
  if (file.exists) file.delete();
}
