import type { FileCategory } from '@/theme/tokens';

const PHOTO = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tif', 'tiff'];
const VIDEO = ['mp4', 'mov', 'm4v', '3gp', 'avi', 'mkv', 'webm'];
const DOCUMENT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'csv'];

/** Archive formats we can be handed. Only zip is readable today. */
export const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z'] as const;
export type ArchiveFormat = (typeof ARCHIVE_EXTENSIONS)[number];

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

export function categoryOf(name: string): FileCategory {
  const ext = extensionOf(name);
  if (PHOTO.includes(ext)) return 'photo';
  if (VIDEO.includes(ext)) return 'video';
  if (DOCUMENT.includes(ext)) return 'document';
  return 'other';
}

/**
 * Photos and videos are the only things the system gallery will accept.
 * Everything else has to land in the app's documents folder instead.
 */
export function goesToGallery(name: string): boolean {
  const category = categoryOf(name);
  return category === 'photo' || category === 'video';
}

/** Short uppercase badge for a tile — "JPG", "DOCX", or "FILE" when unknown. */
export function labelOf(name: string): string {
  const ext = extensionOf(name);
  return ext ? ext.toUpperCase().slice(0, 4) : 'FILE';
}

export function archiveFormatOf(name: string): ArchiveFormat | null {
  const ext = extensionOf(name);
  return (ARCHIVE_EXTENSIONS as readonly string[]).includes(ext) ? (ext as ArchiveFormat) : null;
}

/**
 * The format an archive's own first bytes declare.
 *
 * This is the only source of truth that cannot be wrong. Names are what the
 * sending app felt like calling the file, MIME types are what a content provider
 * guessed, but the signature is written into the format itself. Everything else
 * here is a fallback for when these bytes are unreadable.
 *
 * `head` needs to be at least 8 bytes; fewer is not an archive of any kind.
 */
export function archiveFormatFromBytes(head: Uint8Array): ArchiveFormat | null {
  if (head.length < 8) return null;

  const starts = (...signature: number[]) => signature.every((byte, i) => head[i] === byte);

  // "PK" — the local file header, but also the empty and spanned variants, so
  // only the first two bytes plus a plausible third are checked.
  if (starts(0x50, 0x4b) && (head[2] === 0x03 || head[2] === 0x05 || head[2] === 0x07)) {
    return 'zip';
  }
  // "Rar!\x1A\x07" then 0x00 for RAR4 and 0x01 for RAR5. Both read as "rar".
  if (starts(0x52, 0x61, 0x72, 0x21, 0x1a, 0x07)) return 'rar';
  if (starts(0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c)) return '7z';

  return null;
}

/**
 * The format a content provider is claiming, for files that arrive without a
 * usable name.
 *
 * Matched on a substring rather than a fixed list because there is no agreed
 * spelling — the same `.rar` is `application/rar` on one phone and
 * `application/x-rar-compressed` on the next. See `archive-mime-types.json`.
 * `7z` is tested first: it is the only one whose spellings never contain
 * another format's name, so checking it early costs nothing and rules it out.
 */
export function archiveFormatFromType(mimeType: string): ArchiveFormat | null {
  const type = mimeType.toLowerCase();
  if (type.includes('7z')) return '7z';
  if (type.includes('rar')) return 'rar';
  if (type.includes('zip')) return 'zip';
  return null;
}

/**
 * Zip entries carry the full path inside the archive. People recognise
 * "Beach_01.jpg", not "DCIM/2026/Beach_01.jpg".
 */
export function baseName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}
