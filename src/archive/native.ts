/**
 * The one place that knows where the local native module lives. Everything else
 * imports from here, so the relative path out of `src` appears exactly once.
 */
export {
  extractAll,
  libarchiveVersion,
  listEntries,
  type NativeEntry,
} from '../../modules/archive-native';
