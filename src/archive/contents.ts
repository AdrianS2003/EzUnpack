import { Directory, File } from 'expo-file-system';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';

import type { FileCategory } from '@/theme/tokens';

/** Written next to a finished unpack so the folder view can be rebuilt later. */
const MANIFEST = 'contents.json';

export type ContentItem = {
  name: string;
  category: FileCategory;
  /** Where the file actually ended up. */
  kind: 'gallery' | 'file';
  /** Media-store content URI for `gallery`, a `file://` URI for `file`. */
  ref: string;
};

export type Contents = {
  archiveName: string;
  unpackedAt: number;
  items: ContentItem[];
};

export function writeContents(folder: Directory, contents: Contents): void {
  const manifest = new File(folder, MANIFEST);
  manifest.create({ overwrite: true });
  manifest.write(JSON.stringify(contents));
}

/** Returns null when this archive has never been unpacked. */
export function readContents(folder: Directory): Contents | null {
  const manifest = new File(folder, MANIFEST);
  if (!manifest.exists) return null;
  try {
    const parsed = JSON.parse(manifest.textSync()) as Contents;
    return Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
}

const FLAG_GRANT_READ = 1;

/**
 * Asks for gallery *read* access, but only at the moment it is needed.
 *
 * Saving needs write access alone, which is all the first-run screen asks for.
 * Opening a photo afterwards is a read, and Android will not let us pass
 * another app a permission we do not hold ourselves — that mismatch is what
 * threw `SecurityException: UID ... does not have permission` when the button
 * tried to show a photo we had just saved.
 */
async function ensureGalleryRead(): Promise<boolean> {
  const current = await getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await requestPermissionsAsync();
  return asked.granted;
}

/** Last resort: the gallery app itself, which needs no permission from us. */
async function openGalleryApp(): Promise<void> {
  await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
    category: 'android.intent.category.APP_GALLERY',
  });
}

/**
 * Opens the gallery on one specific photo, falling back to the gallery's front
 * door if we were not given permission to point at it.
 */
export async function openInGallery(assetId: string): Promise<void> {
  if (await ensureGalleryRead()) {
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: assetId,
        flags: FLAG_GRANT_READ,
        type: 'image/*',
      });
      return;
    } catch {
      // Some gallery apps refuse the grant; the front door still works.
    }
  }
  await openGalleryApp();
}

/** Opens a saved file in whichever app the phone normally uses for it. */
export async function openItem(item: ContentItem): Promise<void> {
  if (item.kind === 'gallery') {
    await openInGallery(item.ref);
    return;
  }
  // Other apps cannot read a path inside our private storage, so a temporary
  // content URI is minted and read permission travels with the intent.
  const uri = await getContentUriAsync(item.ref);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: uri,
    flags: FLAG_GRANT_READ,
  });
}

/**
 * Hands a saved document to another app — email, WhatsApp, a printer.
 * Only offered for files we hold ourselves; photos are shared from the gallery,
 * which already has its own share button and the permissions to use it.
 */
export async function shareItem(item: ContentItem): Promise<void> {
  if (item.kind !== 'file') return;
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(item.ref);
}

/** Whether the user went through with picking somewhere to save. */
export type SaveOutcome = 'saved' | 'cancelled';

/**
 * Copies a kept document into a folder the user picks.
 *
 * This answers a question the app previously could not. A document opened from
 * here in Word or a PDF reader is handed over as a temporary link; whatever that
 * app then saves, it saves wherever it likes, under whatever name, and we never
 * see it again. Rather than send someone hunting through the phone for it,
 * EzUnpack puts a copy somewhere they chose themselves and can go back to.
 *
 * Android's own picker grants us that one folder persistently, so this needs no
 * storage permission — which is the difference between this and the "show me the
 * whole phone" version of the same idea.
 */
export async function saveItemToPhone(item: ContentItem): Promise<SaveOutcome> {
  if (item.kind !== 'file') return 'cancelled';

  let folder: Directory;
  try {
    folder = await Directory.pickDirectoryAsync();
  } catch {
    // The picker throws on cancel exactly as it does on failure, and here both
    // mean the same thing: no folder was chosen, so nothing has gone wrong.
    return 'cancelled';
  }

  // Deliberately not caught. Unlike cancelling, a copy that fails is worth
  // telling the user about, and the caller has the words for it.
  new File(item.ref).copySync(folder);
  return 'saved';
}
