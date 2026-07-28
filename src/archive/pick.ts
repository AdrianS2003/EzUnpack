import * as DocumentPicker from 'expo-document-picker';

import mimeTypes from '../../archive-mime-types.json';

/**
 * Shared with the "Open with" intent filter — see archive-mime-types.json for
 * why this list lives outside the source tree and how to extend it safely.
 */
const ARCHIVE_MIME_TYPES = [...mimeTypes.types, ...mimeTypes.pickerExtras];

export type PickedFile = { uri: string; name: string };

/** Opens the Android file picker. Resolves to null when the user backs out. */
export async function pickArchive(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ARCHIVE_MIME_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.name };
}
