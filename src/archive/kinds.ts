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
 * Zip entries carry the full path inside the archive. People recognise
 * "Beach_01.jpg", not "DCIM/2026/Beach_01.jpg".
 */
export function baseName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}
