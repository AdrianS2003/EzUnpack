/**
 * Two visual languages, one layout.
 *
 * "minimal" is the calm default: soft shadows, rounded corners, blue accents.
 * "brutal" is the high-contrast option: thick black borders, hard offset
 * shadows, uppercase headings. It exists for people with weaker eyesight, so
 * every value here is deliberately louder rather than merely different.
 */

export type ThemeName = 'minimal' | 'brutal';

export const INK = '#0F172A';

/**
 * Real archives contain arbitrary extensions, so tiles are coloured by what a
 * file *is* rather than by a fixed list of extensions. The tile still shows the
 * real extension as its label.
 */
export type FileCategory = 'photo' | 'video' | 'document' | 'other';

export type Tokens = {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  action: string;
  actionInk: string;
  /** Drop shadow under the primary action buttons. */
  actionShadow: string;
  /** Corner radius: large surfaces, small surfaces, pills. */
  r: number;
  rSm: number;
  rPill: number;
  /** Border width used on every bordered surface (0 in minimal). */
  bw: number;
  borderColor: string;
  cardShadow: string;
  flatShadow: string;
  headShadow: string;
  chip: string;
  chipInk: string;
  track: string;
  tile: Record<FileCategory, string>;
  /** Weight + casing shared by every heading. */
  heading: '700' | '900';
  upper: 'none' | 'uppercase';
  ls: number;
  mint: string;
  mintInk: string;
  yellow: string;
  yellowInk: string;
  /** Reserved for the one destructive action in the app: deleting an archive. */
  danger: string;
  dangerSoft: string;
  /** Hairline used inside cards to separate rows. */
  divider: string;
};

export const THEMES: Record<ThemeName, Tokens> = {
  minimal: {
    bg: '#F0F4F8',
    surface: '#FFFFFF',
    text: '#1E293B',
    muted: '#64748B',
    accent: '#2563EB',
    accentSoft: '#EAF1FE',
    action: '#059669',
    actionInk: '#FFFFFF',
    actionShadow: '0 4px 0 0 #047857',
    r: 20,
    rSm: 14,
    rPill: 999,
    bw: 0,
    borderColor: 'transparent',
    cardShadow: '0 6px 20px 0 rgba(15,23,42,0.08)',
    flatShadow: '0 3px 12px 0 rgba(15,23,42,0.06)',
    headShadow: '0 4px 18px 0 rgba(15,23,42,0.07)',
    chip: '#F1F5F9',
    chipInk: '#334155',
    track: '#E2E8F0',
    tile: { photo: '#E5EDFB', video: '#EFE6FE', document: '#FDE8E8', other: '#EEF2F7' },
    heading: '700',
    upper: 'none',
    ls: -0.3,
    mint: '#ECFDF5',
    mintInk: '#065F46',
    yellow: '#EFF6FF',
    yellowInk: '#1E3A8A',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
    divider: '#F1F5F9',
  },
  brutal: {
    bg: '#FDFBF7',
    surface: '#FFFFFF',
    text: INK,
    muted: '#4B5563',
    accent: INK,
    accentSoft: '#FDE047',
    action: '#34D399',
    actionInk: INK,
    actionShadow: `4px 4px 0 0 ${INK}`,
    r: 6,
    rSm: 4,
    rPill: 6,
    bw: 3,
    borderColor: INK,
    cardShadow: `5px 5px 0 0 ${INK}`,
    flatShadow: `4px 4px 0 0 ${INK}`,
    headShadow: `0 4px 0 0 ${INK}`,
    chip: '#FDE047',
    chipInk: INK,
    track: '#E7E5E4',
    tile: { photo: '#A7F3D0', video: '#C4B5FD', document: '#FDE047', other: '#E7E5E4' },
    heading: '900',
    upper: 'uppercase',
    ls: -0.2,
    mint: '#A7F3D0',
    mintInk: INK,
    yellow: '#FDE047',
    yellowInk: INK,
    danger: '#E11D48',
    dangerSoft: '#FECDD3',
    divider: INK,
  },
};

/** Text scale applied when the "bigger text" setting is on. */
export const TEXT_SCALE = { normal: 1, big: 1.18 } as const;
