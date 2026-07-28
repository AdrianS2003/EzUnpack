import { setIncomingUri } from '@/archive/incoming';

/**
 * Expo Router asks us what to do with the URL the app was launched with.
 *
 * "Open with -> EzUnpack" arrives here as a `content://` or `file://` URI,
 * which matches no route. We stash it for the home screen and send the user
 * to the home screen itself, instead of letting the router render "unmatched".
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  if (path.startsWith('content://') || path.startsWith('file://')) {
    setIncomingUri(path);
    return '/';
  }
  return path;
}
