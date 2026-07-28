/**
 * Archivo carries the whole type system. React Native does not synthesise
 * weights reliably on Android, so each weight is a separate loaded family and
 * `font()` is the only way styles should ask for one.
 */
export const FONT = {
  400: 'Archivo_400Regular',
  500: 'Archivo_500Medium',
  600: 'Archivo_600SemiBold',
  700: 'Archivo_700Bold',
  800: 'Archivo_800ExtraBold',
  900: 'Archivo_900Black',
} as const;

export type FontWeight = keyof typeof FONT;

export function font(weight: FontWeight) {
  return FONT[weight];
}
