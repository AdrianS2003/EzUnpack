import { Directory, File, Paths } from 'expo-file-system';
import { Album, Asset, requestPermissionsAsync } from 'expo-media-library';

import { writeContents, type ContentItem } from '@/archive/contents';
import { baseName, categoryOf, goesToGallery, labelOf } from '@/archive/kinds';
import { extractAll, listEntries } from '@/archive/native';
import type { Archive, ArchiveEntry } from '@/data/archives';

/** Album the phone's gallery shows, so our photos do not land among the camera roll. */
export const GALLERY_ALBUM = 'EzUnpack';

/** Root of the per-archive folders, inside the app's own storage. */
export const FILES_FOLDER = 'Files';
const LIBRARY_FOLDER = 'EzUnpack';

export type UnpackFailure = 'needs-password' | 'gallery-permission' | 'unreadable' | 'write-failed';

/** What the user is waiting for, so the sheet can say so. */
export type UnpackStage = 'extracting' | 'saving';

/** Carries a code the UI can turn into a sentence the user understands. */
export class UnpackError extends Error {
  constructor(
    readonly code: UnpackFailure,
    cause?: unknown,
  ) {
    super(code);
    this.name = 'UnpackError';
    this.cause = cause;
  }
}

export type UnpackResult = {
  toGallery: number;
  toDocuments: number;
  /** Content URI of the first saved photo, so "Open Photos" has somewhere to go. */
  firstAssetId: string | null;
};

/**
 * libarchive reports a locked archive through its error message rather than a
 * distinct code, so the message is what we have to read. Getting this right
 * matters: "it needs a password" is something the user can act on, while "could
 * not be read" leaves them stuck.
 */
function classify(error: unknown): UnpackFailure {
  const message = String((error as Error)?.message ?? '').toLowerCase();
  if (
    message.includes('passphrase') ||
    message.includes('password') ||
    message.includes('encrypt')
  ) {
    return 'needs-password';
  }
  return 'unreadable';
}

/** Noise that archivers add and users never want to see. */
function isJunk(path: string): boolean {
  const name = baseName(path);
  return (
    path.startsWith('__MACOSX/') ||
    name === '.DS_Store' ||
    name === 'Thumbs.db' ||
    name.startsWith('._')
  );
}

function safeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/^\.+/, '') || 'file';
}

/** Folder that holds one archive's unpacked contents. */
export function folderFor(archive: Archive): Directory {
  const stem = safeName(archive.name.replace(/\.[^.]+$/, ''));
  return new Directory(Paths.document, LIBRARY_FOLDER, FILES_FOLDER, stem);
}

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
  throw new UnpackError('write-failed');
}

/** Lets React paint between two pieces of blocking work. */
function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Moves freshly created assets into our own gallery album.
 *
 * Without this every photo lands in the main camera folder, mixed in with the
 * user's own pictures — which is exactly where they become impossible to find
 * again.
 */
async function fileIntoAlbum(assets: Asset[]): Promise<void> {
  if (assets.length === 0) return;
  const existing = await Album.get(GALLERY_ALBUM);
  if (existing) await existing.add(assets);
  else await Album.create(GALLERY_ALBUM, assets, true);
}

/** Reads the archive's table of contents without decompressing anything. */
export async function inspectArchive(archive: Archive): Promise<ArchiveEntry[]> {
  let entries;
  try {
    entries = await listEntries(archive.uri);
  } catch (error) {
    throw new UnpackError(classify(error), error);
  }

  return entries
    .filter((entry) => !entry.dir && !isJunk(entry.path))
    .map((entry) => {
      const name = baseName(entry.path);
      return {
        path: entry.path,
        name,
        label: labelOf(name),
        category: categoryOf(name),
        bytes: entry.size,
      };
    });
}

/**
 * Unpacks an archive in two stages.
 *
 * Everything is decompressed into a scratch folder first, in one native pass.
 * That single pass is the point: RAR5 and 7z archives are usually "solid",
 * meaning the files share one compression stream and reaching the last one
 * requires decompressing all the others. Pulling files out individually would
 * redo that work every time.
 *
 * Then each extracted file is moved to where it belongs — photos and videos
 * into the phone's gallery, everything else into this archive's folder — which
 * is the part that reports progress, because it is the part we can count.
 */
export async function unpackArchive(
  archive: Archive,
  entries: ArchiveEntry[],
  onStage: (stage: UnpackStage) => void,
  onProgress: (done: number, total: number) => void,
): Promise<UnpackResult> {
  const wantsGallery = entries.some((entry) => goesToGallery(entry.name));
  if (wantsGallery) {
    const permission = await requestPermissionsAsync(true);
    if (!permission.granted) throw new UnpackError('gallery-permission');
  }

  const staging = new Directory(Paths.cache, 'ezunpack-extract');
  try {
    if (staging.exists) staging.delete();
  } catch {
    // A stale scratch folder is not worth failing over; names will not collide.
  }
  staging.create({ intermediates: true, idempotent: true });

  onStage('extracting');
  await yieldToUi();

  let written: string[];
  try {
    written = await extractAll(archive.uri, staging.uri);
  } catch (error) {
    throw new UnpackError(classify(error), error);
  }

  const wanted = written.filter((relative) => !isJunk(relative));

  onStage('saving');
  onProgress(0, wanted.length);

  const folder = folderFor(archive);
  folder.create({ intermediates: true, idempotent: true });

  const created: Asset[] = [];
  const items: ContentItem[] = [];
  let toGallery = 0;
  let toDocuments = 0;

  try {
    for (let index = 0; index < wanted.length; index++) {
      const relative = wanted[index];
      const source = new File(staging, relative);
      const name = safeName(baseName(relative));

      if (!source.exists) continue;

      if (goesToGallery(name)) {
        try {
          const asset = await Asset.create(source.uri);
          created.push(asset);
          items.push({ name, category: categoryOf(name), kind: 'gallery', ref: asset.id });
          toGallery++;
        } catch (error) {
          throw new UnpackError('write-failed', error);
        }
      } else {
        try {
          const target = freeFile(folder, name);
          source.copySync(target);
          items.push({ name, category: categoryOf(name), kind: 'file', ref: target.uri });
          toDocuments++;
        } catch (error) {
          throw new UnpackError('write-failed', error);
        }
      }

      onProgress(index + 1, wanted.length);
      await yieldToUi();
    }

    try {
      await fileIntoAlbum(created);
    } catch {
      // The photos are saved either way; only their album placement failed.
    }

    writeContents(folder, { archiveName: archive.name, unpackedAt: Date.now(), items });
  } finally {
    try {
      staging.delete();
    } catch {
      // Cache is the system's to reclaim.
    }
  }

  return {
    toGallery,
    toDocuments,
    firstAssetId: created[0]?.id ?? null,
  };
}
