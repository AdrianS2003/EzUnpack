/**
 * One layout, two grounds.
 *
 * The app used to ship a second *visual language* — thick black borders, hard
 * offset shadows, uppercase headings — offered as a high-contrast option for
 * weaker eyesight. It was dropped: the uppercase headings worked against the
 * very readers it was meant to serve, since capitals throw away the word shapes
 * slow readers rely on, and "bigger text" already carries that job on its own.
 *
 * What is left is light and dark, which differ only in ground and ink. Screens
 * read `k.*` and never branch on which one is active — that is the whole point
 * of the two sets having the same shape.
 */

export type ThemeName = 'light' | 'dark';

/** What the user picked. `system` follows the phone, and is the default. */
export type ThemePreference = ThemeName | 'system';

/**
 * Real archives contain arbitrary extensions, so tiles are coloured by what a
 * file *is* rather than by a fixed list of extensions. The tile still shows the
 * real extension as its label.
 */
export type FileCategory = 'photo' | 'video' | 'document' | 'other';

export type Tokens = {
  bg: string;
  surface: string;
  /** A step back from `surface`: search box, secondary buttons, file tiles. */
  sunken: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  /** Drop shadow under a button filled with `accent`, a shade darker than it. */
  accentShadow: string;
  /** Hairline for surfaces tinted with `accentSoft`. */
  accentLine: string;
  action: string;
  actionInk: string;
  /** Drop shadow under the primary action buttons. */
  actionShadow: string;
  /** Corner radius: large surfaces, small surfaces, pills. */
  r: number;
  rSm: number;
  rPill: number;
  /**
   * Border width on cards and sheets. Zero on light, where a soft shadow does
   * the separating; one on dark, where shadows are invisible and a surface
   * needs an edge to lift off the ground.
   */
  bw: number;
  borderColor: string;
  /** Hairline around tiles, inputs and secondary buttons. */
  line: string;
  cardShadow: string;
  flatShadow: string;
  headShadow: string;
  chip: string;
  chipInk: string;
  track: string;
  tile: Record<FileCategory, string>;
  /** Letter spacing shared by every heading. */
  ls: number;
  mint: string;
  mintInk: string;
  /** The mint note is faint on a white card and needs an edge; yellow does not. */
  mintLine: string;
  yellow: string;
  yellowInk: string;
  /** Reserved for the one destructive action in the app: deleting an archive. */
  danger: string;
  dangerSoft: string;
  /** Hairline used inside cards to separate rows. */
  divider: string;
  /** What the status bar should draw its clock and icons in. */
  bar: 'light' | 'dark';
};

export const THEMES: Record<ThemeName, Tokens> = {
  light: {
    bg: '#F0F4F8',
    surface: '#FFFFFF',
    sunken: '#F1F5F9',
    text: '#1E293B',
    muted: '#64748B',
    // The logo blue, and a tint and a shade derived from it at the same hue.
    accent: '#386C96',
    accentSoft: '#E8F0F7',
    accentShadow: '0 4px 0 0 #274B68',
    accentLine: '#D6E4F0',
    action: '#059669',
    actionInk: '#FFFFFF',
    actionShadow: '0 4px 0 0 #047857',
    r: 20,
    rSm: 14,
    rPill: 999,
    bw: 0,
    borderColor: 'transparent',
    line: '#E2E8F0',
    cardShadow: '0 6px 20px 0 rgba(15,23,42,0.08)',
    flatShadow: '0 3px 12px 0 rgba(15,23,42,0.06)',
    headShadow: '0 4px 18px 0 rgba(15,23,42,0.07)',
    chip: '#F1F5F9',
    chipInk: '#334155',
    track: '#E2E8F0',
    tile: { photo: '#E4EDF5', video: '#EFE6FE', document: '#FDE8E8', other: '#EEF2F7' },
    ls: -0.3,
    mint: '#ECFDF5',
    mintInk: '#065F46',
    mintLine: '#A7F3D0',
    // The advice strips are blue in this theme, so they follow the logo too.
    yellow: '#EDF3F9',
    yellowInk: '#2B5273',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
    divider: '#F1F5F9',
    bar: 'dark',
  },
  dark: {
    bg: '#0F172A',
    surface: '#1B2735',
    sunken: '#16212E',
    text: '#E8EEF5',
    muted: '#93A4B8',
    // The logo blue lifted until it carries text on a dark ground: #386C96
    // itself only reaches 1.9:1 there, which is unreadable.
    accent: '#5A93C4',
    accentSoft: '#1E3348',
    accentShadow: '0 4px 0 0 #23405A',
    accentLine: '#2E4C68',
    action: '#059669',
    actionInk: '#FFFFFF',
    actionShadow: '0 4px 0 0 #047857',
    r: 20,
    rSm: 14,
    rPill: 999,
    bw: 1,
    borderColor: '#26313F',
    line: '#2A3644',
    // Shadows do not read on a dark ground, so they are only deep enough to
    // hint at a raised surface; the border above does the real separating.
    cardShadow: '0 6px 20px 0 rgba(0,0,0,0.35)',
    flatShadow: '0 3px 12px 0 rgba(0,0,0,0.25)',
    headShadow: '0 4px 18px 0 rgba(0,0,0,0.35)',
    chip: '#24313F',
    chipInk: '#C2CFDC',
    track: '#2A3644',
    tile: { photo: '#1E3348', video: '#2A2340', document: '#3A2226', other: '#232E3B' },
    ls: -0.3,
    mint: '#12352C',
    mintInk: '#6EE7B7',
    mintLine: '#1E5745',
    yellow: '#16293B',
    yellowInk: '#9CC4E4',
    danger: '#F87171',
    dangerSoft: '#3A1E1E',
    divider: '#24313F',
    bar: 'light',
  },
};

/** Text scale applied when the "bigger text" setting is on. */
export const TEXT_SCALE = { normal: 1, big: 1.18 } as const;
