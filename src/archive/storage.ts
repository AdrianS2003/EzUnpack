import { Directory, Paths } from 'expo-file-system';

import { LIBRARY_FOLDER, listArchives } from '@/archive/library';
import { FILES_FOLDER, folderFor } from '@/archive/unpack';

/**
 * What EzUnpack occupies, and what it is occupying for no reason.
 *
 * Deleting an archive takes its unpacked folder with it, so in normal use
 * nothing is left behind. Folders outlive their archive when the archive left
 * some other way: the app's data was cleared halfway, a copy failed after the
 * folder was made, a file was removed by a cleaner app. Nothing points at those
 * folders any more, so without this they would sit there for the life of the
 * install.
 */

function libraryRoot(): Directory {
  return new Directory(Paths.document, LIBRARY_FOLDER);
}

function filesRoot(): Directory {
  return new Directory(Paths.document, LIBRARY_FOLDER, FILES_FOLDER);
}

export type Storage = {
  /** Everything the app holds, in bytes. */
  bytes: number;
  /** Folders whose archive is gone. */
  leftover: Directory[];
  leftoverBytes: number;
};

/**
 * Walks our own folder and works out which parts are still spoken for.
 *
 * A folder is "spoken for" when some archive we still hold maps onto it.
 * `folderFor` is the only thing that knows that mapping — including its
 * fallback to the pre-extension folder names — so asking it about every archive
 * we have is the only way to build the list that cannot drift out of step.
 */
export function measureStorage(): Storage {
  const root = libraryRoot();
  const bytes = root.exists ? (root.size ?? 0) : 0;

  const files = filesRoot();
  if (!files.exists) return { bytes, leftover: [], leftoverBytes: 0 };

  const claimed = new Set(listArchives().map((archive) => folderFor(archive).name));
  const leftover = files
    .list()
    .filter((entry): entry is Directory => entry instanceof Directory)
    .filter((folder) => !claimed.has(folder.name));

  const leftoverBytes = leftover.reduce((total, folder) => total + (folder.size ?? 0), 0);

  return { bytes, leftover, leftoverBytes };
}

/**
 * Throws away the folders `measureStorage` found and returns the bytes freed.
 *
 * A folder that refuses to go is skipped rather than aborting the sweep — the
 * point is to free what can be freed, and the next measurement will simply
 * report it as still there.
 */
export function sweepLeftovers(leftover: Directory[]): number {
  let freed = 0;

  for (const folder of leftover) {
    const size = folder.size ?? 0;
    try {
      if (folder.exists) folder.delete();
      freed += size;
    } catch {
      // Left for the next sweep.
    }
  }

  return freed;
}
