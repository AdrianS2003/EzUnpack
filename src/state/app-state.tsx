import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { STRINGS, type Lang, type Strings } from '@/i18n/strings';
import {
  TEXT_SCALE,
  THEMES,
  type ThemeName,
  type ThemePreference,
  type Tokens,
} from '@/theme/tokens';

const STORAGE_KEY = 'ezunpack.prefs.v1';

export type Settings = {
  /** Scales every font size up. */
  bigText: boolean;
  /** Plays a sound when a save finishes. */
  sounds: boolean;
  /** Shows a confirmation step before writing anything to the phone. */
  askBeforeSave: boolean;
};

type Prefs = {
  lang: Lang;
  /** What the user picked, which may be "follow the phone". */
  theme: ThemePreference;
  settings: Settings;
  /** True once the first-run explanation has been shown and acted on. */
  onboarded: boolean;
  /** Archives the user has already saved to the phone. */
  savedIds: string[];
};

const DEFAULTS: Prefs = {
  lang: 'en',
  theme: 'system',
  settings: { bigText: false, sounds: true, askBeforeSave: false },
  onboarded: false,
  savedIds: [],
};

type AppState = Prefs & {
  /** Strings for the active language. */
  t: Strings;
  /** Design tokens for the active theme. */
  k: Tokens;
  /** Which of the two is actually showing, once "system" is resolved. */
  themeName: ThemeName;
  /** Scales a font size by the "bigger text" setting. */
  fs: (size: number) => number;
  setLang: (lang: Lang) => void;
  setTheme: (theme: ThemePreference) => void;
  setSetting: (key: keyof Settings, value: boolean) => void;
  finishOnboarding: () => void;
  markSaved: (id: string) => void;
  /** Drops a deleted archive's id, so the list does not grow with dead entries. */
  forgetSaved: (id: string) => void;
  /** False until stored preferences have been read back. */
  ready: boolean;
};

const AppContext = createContext<AppState | null>(null);

function detectLang(): Lang {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
    return locale.toLowerCase().startsWith('ro') ? 'ro' : 'en';
  } catch {
    return 'en';
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [ready, setReady] = useState(false);
  // Nothing is written back until the first read has finished, otherwise the
  // defaults would overwrite what the user picked last time.
  const loaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        const stored = raw ? (JSON.parse(raw) as Partial<Prefs>) : null;
        setPrefs({
          ...DEFAULTS,
          lang: detectLang(),
          ...stored,
          settings: { ...DEFAULTS.settings, ...stored?.settings },
        });
      })
      .catch(() => {
        if (!cancelled) setPrefs({ ...DEFAULTS, lang: detectLang() });
      })
      .finally(() => {
        if (cancelled) return;
        loaded.current = true;
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [prefs]);

  // The phone's own light/dark setting, which "system" follows. Android users
  // have usually set this once already, often on their own schedule — switching
  // on a clock of our own would only fight it.
  const phoneScheme = useColorScheme();

  const value = useMemo<AppState>(() => {
    const scale = prefs.settings.bigText ? TEXT_SCALE.big : TEXT_SCALE.normal;
    const themeName: ThemeName =
      prefs.theme === 'system' ? (phoneScheme === 'dark' ? 'dark' : 'light') : prefs.theme;

    return {
      ...prefs,
      t: STRINGS[prefs.lang],
      k: THEMES[themeName],
      themeName,
      fs: (size: number) => Math.round(size * scale * 10) / 10,
      setLang: (lang) => setPrefs((p) => ({ ...p, lang })),
      setTheme: (theme) => setPrefs((p) => ({ ...p, theme })),
      setSetting: (key, v) => setPrefs((p) => ({ ...p, settings: { ...p.settings, [key]: v } })),
      finishOnboarding: () => setPrefs((p) => ({ ...p, onboarded: true })),
      markSaved: (id) =>
        setPrefs((p) => (p.savedIds.includes(id) ? p : { ...p, savedIds: [...p.savedIds, id] })),
      forgetSaved: (id) =>
        setPrefs((p) =>
          p.savedIds.includes(id) ? { ...p, savedIds: p.savedIds.filter((s) => s !== id) } : p,
        ),
      ready,
    };
  }, [phoneScheme, prefs, ready]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
