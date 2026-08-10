import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

/**
 * The address a report is addressed to.
 *
 * Every user of the app can see this: it is the `To:` line of the message their
 * mail app opens. Swap it for a dedicated inbox before publishing if you would
 * rather not put a personal address in front of a store audience.
 */
export const SUPPORT_EMAIL = 'adystefan2003@gmail.com';

/** So a report says more than "it broke". */
function phone(): string {
  if (Platform.OS !== 'android') return Platform.OS;
  const { Brand, Model, Release, Version } = Platform.constants;
  return `${Brand} ${Model}, Android ${Release} (API ${Version})`;
}

function version(): string {
  return Constants.expoConfig?.version ?? 'unknown';
}

/**
 * Builds the message the user's mail app opens with.
 *
 * The technical part goes below a divider and under the space the user types
 * in, so the first thing they see is a prompt in their own language rather than
 * a stack trace. `mailto:` has no agreed length limit and some mail apps quietly
 * truncate or refuse long ones, so the trace is capped well short of where that
 * starts to happen.
 */
const TRACE_LIMIT = 1200;

export function reportUrl(subject: string, prompt: string, error?: unknown): string {
  const lines = [prompt, '', '', '--- ', `EzUnpack ${version()}`, phone()];

  if (error) {
    const detail = String((error as Error)?.stack ?? (error as Error)?.message ?? error);
    lines.push('', detail.slice(0, TRACE_LIMIT));
  }

  const body = encodeURIComponent(lines.join('\n'));
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`;
}

/**
 * Opens the phone's mail app on a prepared message. Nothing is sent by the app
 * itself — the user reads it, decides, and presses send, which is why this needs
 * no permission and why nothing leaves the phone unasked.
 *
 * `canOpenURL` is deliberately not consulted first: on Android 11 and later it
 * answers false for schemes the manifest has not declared a `<queries>` entry
 * for, even when a mail app is installed and would handle the intent perfectly
 * well. Attempting it and catching the failure is the honest test.
 */
export async function openReport(
  subject: string,
  prompt: string,
  error?: unknown,
): Promise<boolean> {
  try {
    await Linking.openURL(reportUrl(subject, prompt, error));
    return true;
  } catch {
    return false;
  }
}
