import * as IntentLauncher from 'expo-intent-launcher';

import type { Lang } from '@/i18n/strings';

/**
 * Voice search, handed to the phone's own speech dialog.
 *
 * The obvious alternative is a recognition library and a microphone dialog of
 * our own. This is better for this app on three counts. The dialog Google shows
 * is the one the user has already used in the Google app, so it needs no
 * learning. It speaks Romanian without us shipping a model. And it keeps
 * `RECORD_AUDIO` out of our manifest entirely — the microphone belongs to the
 * recogniser, not to us, which is one permission we never have to explain to
 * the user or declare to the Play Store.
 *
 * The constants are Android's `RecognizerIntent` fields, written out because
 * they arrive as plain intent extras rather than through a typed module.
 */
const RECOGNIZE_SPEECH = 'android.speech.action.RECOGNIZE_SPEECH';
const EXTRA_LANGUAGE_MODEL = 'android.speech.extra.LANGUAGE_MODEL';
const EXTRA_LANGUAGE = 'android.speech.extra.LANGUAGE';
const EXTRA_PROMPT = 'android.speech.extra.PROMPT';
const EXTRA_MAX_RESULTS = 'android.speech.extra.MAX_RESULTS';
const EXTRA_RESULTS = 'android.speech.extra.RESULTS';
const FREE_FORM = 'free_form';

/** Dictation is not a command language, so the recogniser is told the region. */
const LOCALE: Record<Lang, string> = { en: 'en-US', ro: 'ro-RO' };

export type Heard =
  /** The user said something we can search for. */
  | { status: 'heard'; text: string }
  /** They backed out, or the recogniser understood nothing. */
  | { status: 'nothing' }
  /** This phone has no speech app at all. */
  | { status: 'unavailable' };

/**
 * Opens the speech dialog and resolves once the user is back in the app.
 * `prompt` is the line shown above the microphone, so it should be the same
 * sentence we would have written on a dialog of our own.
 */
export async function listen(lang: Lang, prompt: string): Promise<Heard> {
  let result: IntentLauncher.IntentLauncherResult;

  try {
    result = await IntentLauncher.startActivityAsync(RECOGNIZE_SPEECH, {
      extra: {
        [EXTRA_LANGUAGE_MODEL]: FREE_FORM,
        [EXTRA_LANGUAGE]: LOCALE[lang],
        [EXTRA_PROMPT]: prompt,
        [EXTRA_MAX_RESULTS]: 1,
      },
    });
  } catch {
    // Nothing on this phone answers the intent — a stripped ROM, or a device
    // without Google's services. There is nothing to retry.
    return { status: 'unavailable' };
  }

  if (result.resultCode !== IntentLauncher.ResultCode.Success) return { status: 'nothing' };

  const text = firstPhrase(result.extra);
  return text ? { status: 'heard', text } : { status: 'nothing' };
}

/** The recogniser returns its guesses best-first; we only want the best one. */
function firstPhrase(extra: object | undefined): string | null {
  const results = (extra as Record<string, unknown> | undefined)?.[EXTRA_RESULTS];
  if (!Array.isArray(results)) return null;

  for (const phrase of results) {
    if (typeof phrase === 'string' && phrase.trim()) return phrase.trim();
  }
  return null;
}
