import type { FileCategory } from '@/theme/tokens';

/** How an archive reached us. Drives the little chip on the card. */
export type ArchiveSource = 'picked' | 'shared' | 'opened';

export type ArchiveEntry = {
  /** Full path inside the archive — what we ask the zip reader for. */
  path: string;
  /** Just the file name, which is what the user sees. */
  name: string;
  /** Uppercase extension badge shown on the tile. */
  label: string;
  category: FileCategory;
  /** Uncompressed size in bytes; 0 when the archive did not report one. */
  bytes: number;
};

export type Archive = {
  /** The `file://` URI of our own copy, which is also its identity. */
  id: string;
  name: string;
  /** Uppercase archive extension: ZIP, RAR, 7Z. */
  ext: string;
  uri: string;
  sizeBytes: number;
  source: ArchiveSource;
  /** Millisecond timestamp of when we took the copy; newest sorts first. */
  receivedAt: number;
  /** Filled in lazily when the sheet reads the archive. */
  files: ArchiveEntry[];
};
