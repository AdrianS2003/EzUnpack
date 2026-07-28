/**
 * Holds a file the operating system handed us before React was ready.
 *
 * When someone taps "Open with -> EzUnpack", Android launches the app with the
 * file URI attached. Expo Router hands that to `+native-intent` before any
 * screen mounts, so it is parked here until the home screen can pick it up.
 */
let pending: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function setIncomingUri(uri: string): void {
  pending = uri;
  emit();
}

export function getIncomingUri(): string | null {
  return pending;
}

/** Reads and clears in one step, so a file is never imported twice. */
export function takeIncomingUri(): string | null {
  const uri = pending;
  pending = null;
  if (uri) emit();
  return uri;
}

export function subscribeIncoming(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
