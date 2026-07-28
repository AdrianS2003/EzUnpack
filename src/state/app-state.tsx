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

import { STRINGS, type Lang, type Strings } from '@/i18n/strings';
import { TEXT_SCALE, THEMES, type ThemeName, type Tokens } from '@/theme/tokens';

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
  theme: ThemeName;
  settings: Settings;
  /** True once the first-run explanation has been shown and acted on. */
  onboarded: boolean;
  /** Archives the user has already saved to the phone. */
  savedIds: string[];
};

const DEFAULTS: Prefs = {
  lang: 'en',
  theme: 'minimal',
  settings: { bigText: false, sounds: true, askBeforeSave: false },
  onboarded: false,
  savedIds: [],
};

type AppState = Prefs & {
  /** Strings for the active language. */
  t: Strings;
  /** Design tokens for the active theme. */
  k: Tokens;
  /** Scales a font size by the "bigger text" setting. */
  fs: (size: number) => number;
  setLang: (lang: Lang) => void;
  setTheme: (theme: ThemeName) => void;
  setSetting: (key: keyof Settings, value: boolean) => void;
  finishOnboarding: () => void;
  markSaved: (id: string) => void;
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

  const value = useMemo<AppState>(() => {
    const scale = prefs.settings.bigText ? TEXT_SCALE.big : TEXT_SCALE.normal;
    return {
      ...prefs,
      t: STRINGS[prefs.lang],
      k: THEMES[prefs.theme],
      fs: (size: number) => Math.round(size * scale * 10) / 10,
      setLang: (lang) => setPrefs((p) => ({ ...p, lang })),
      setTheme: (theme) => setPrefs((p) => ({ ...p, theme })),
      setSetting: (key, v) => setPrefs((p) => ({ ...p, settings: { ...p.settings, [key]: v } })),
      finishOnboarding: () => setPrefs((p) => ({ ...p, onboarded: true })),
      markSaved: (id) =>
        setPrefs((p) => (p.savedIds.includes(id) ? p : { ...p, savedIds: [...p.savedIds, id] })),
      ready,
    };
  }, [prefs, ready]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
