// Imported from `expo` rather than `expo-modules-core`: the latter is not
// hoisted to the project's node_modules in this install, so neither Metro nor
// TypeScript can resolve it from here. `expo` re-exports the same function.
import { requireNativeModule } from 'expo';

/** One entry as libarchive reports it, before we tidy it up for the UI. */
export type NativeEntry = {
  /** Path inside the archive, directory separators and all. */
  path: string;
  /** Uncompressed size in bytes; 0 when the format does not record one. */
  size: number;
  dir: boolean;
};

type ArchiveNativeModule = {
  /** Version string reported by libarchive itself. Useful for diagnostics. */
  libarchiveVersion(): string;
  listEntries(uri: string): Promise<string>;
  extractAll(uri: string, destination: string): Promise<string>;
};

const native = requireNativeModule<ArchiveNativeModule>('ArchiveNative');

export function libarchiveVersion(): string {
  return native.libarchiveVersion();
}

/** Reads the archive's table of contents without decompressing anything. */
export async function listEntries(uri: string): Promise<NativeEntry[]> {
  return JSON.parse(await native.listEntries(uri)) as NativeEntry[];
}

/**
 * Decompresses everything into `destination` in one pass and returns the
 * relative paths written. Entries that would escape the destination folder are
 * skipped by the native side rather than written.
 */
export async function extractAll(uri: string, destination: string): Promise<string[]> {
  return JSON.parse(await native.extractAll(uri, destination)) as string[];
}
