import type { ReactNode } from 'react';
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { useApp } from '@/state/app-state';
import { font } from '@/theme/fonts';

/* ------------------------------------------------------------------ text */

/** Section titles, card titles, screen titles — one weight rule for all. */
export function Heading({
  size,
  children,
  style,
  numberOfLines,
}: {
  size: number;
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { k, fs } = useApp();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: font(700),
          fontSize: fs(size),
          color: k.text,
          letterSpacing: k.ls,
          lineHeight: fs(size) * 1.2,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

/** The quiet explanatory line that sits under almost every title. */
export function Sub({
  children,
  size = 14.5,
  style,
}: {
  children: ReactNode;
  size?: number;
  style?: StyleProp<TextStyle>;
}) {
  const { k, fs } = useApp();
  return (
    <Text
      style={[
        {
          fontFamily: font(400),
          fontSize: fs(size),
          color: k.muted,
          lineHeight: fs(size) * 1.35,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Label({
  children,
  size = 15,
  color,
  weight = 600,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  weight?: 400 | 500 | 600 | 700 | 800 | 900;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { k, fs } = useApp();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: font(weight), fontSize: fs(size), color: color ?? k.muted },
        style,
      ]}>
      {children}
    </Text>
  );
}

/* --------------------------------------------------------------- surfaces */

export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const { k } = useApp();
  return (
    <View
      style={[
        {
          backgroundColor: k.surface,
          borderRadius: k.r,
          borderWidth: k.bw,
          borderColor: k.borderColor,
          boxShadow: k.cardShadow,
          padding: padded ? 18 : 0,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

/* ---------------------------------------------------------------- buttons */

/**
 * The one button people are meant to hit. Minimum 64px tall, an icon plus a
 * short verb, and it visibly sinks when pressed so a tap never feels ignored.
 */
export function BigButton({
  label,
  icon,
  onPress,
  background,
  ink,
  shadow,
  style,
  minHeight = 70,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  /** Defaults to the theme's action green. */
  background?: string;
  ink?: string;
  /** Defaults to the theme's action shadow. */
  shadow?: string;
  style?: StyleProp<ViewStyle>;
  minHeight?: number;
}) {
  const { k, fs } = useApp();
  const bg = background ?? k.action;
  const color = ink ?? k.actionInk;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: '100%',
          minHeight,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: k.rSm,
          borderWidth: k.bw,
          borderColor: k.borderColor,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 11,
          boxShadow: pressed ? 'none' : (shadow ?? k.actionShadow),
          // Always an array: letting `transform` become undefined between
          // renders makes React Native process a null transform and throw.
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
        style,
      ]}>
      {icon ? <Icon name={icon} size={25} color={color} strokeWidth={2.4} /> : null}
      <Text
        style={{
          fontFamily: font(700),
          fontSize: fs(19.5),
          color,
          textAlign: 'center',
          lineHeight: fs(19.5) * 1.2,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The quiet way out of a card: same full width as the green button so it is
 * just as easy to hit, but flat and unfilled so it never competes with it.
 * `danger` is for the one destructive action there is — deleting an archive.
 */
export function GhostButton({
  label,
  onPress,
  icon,
  tone = 'muted',
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  tone?: 'muted' | 'danger';
}) {
  const { k, fs } = useApp();
  const color = tone === 'danger' ? k.danger : k.muted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: '100%',
        minHeight: 58,
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderRadius: k.rSm,
        // A pressed ghost button has no shadow to sink into, so the tint is the
        // only thing that tells the user the tap landed.
        backgroundColor: pressed ? (tone === 'danger' ? k.dangerSoft : k.sunken) : 'transparent',
      })}>
      {icon ? <Icon name={icon} size={22} color={color} strokeWidth={2.3} /> : null}
      <Text style={{ fontFamily: font(700), fontSize: fs(18), color }}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------- selectors */

export type SegmentOption = { key: string; label: string };

/**
 * Language and theme pickers. Every option visible at once, never a menu.
 *
 * The options share the width equally rather than sizing to their text, so that
 * three long words — "Follow phone", "Întunecat" — still fit on a narrow phone
 * with the bigger-text setting on. That means it needs a parent that gives it a
 * width, which is why the settings rows stack the control under its label.
 */
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (key: string) => void;
}) {
  const { k, fs } = useApp();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 5,
        borderRadius: k.rPill + 5,
        backgroundColor: k.sunken,
        borderWidth: 2,
        borderColor: k.line,
      }}>
      {options.map((option) => {
        const on = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.key)}
            style={{
              flex: 1,
              minHeight: 48,
              paddingHorizontal: 8,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: k.rPill,
              backgroundColor: on ? k.accent : 'transparent',
            }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: font(700),
                fontSize: fs(15.5),
                color: on ? '#FFFFFF' : k.muted,
              }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Oversized switch — 76x46 with a 36px knob, easy to hit with a shaky hand. */
export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  const { k } = useApp();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{
        width: 76,
        height: 46,
        padding: 4,
        justifyContent: 'center',
        alignItems: value ? 'flex-end' : 'flex-start',
        borderRadius: 999,
        backgroundColor: value ? k.action : k.track,
        borderWidth: k.bw,
        borderColor: k.borderColor,
      }}>
      {/* The knob stays white in both themes: it is the moving part of a
          switch, and it has to read against the green as well as the track. */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 5px 0 rgba(15,23,42,0.25)',
        }}
      />
    </Pressable>
  );
}

/** Coloured advice strip: the yellow "how this works" and mint "you are safe" notes. */
export function Note({
  icon,
  children,
  tone,
  style,
}: {
  icon: IconName;
  children: ReactNode;
  tone: 'yellow' | 'mint';
  style?: StyleProp<ViewStyle>;
}) {
  const { k } = useApp();
  const bg = tone === 'yellow' ? k.yellow : k.mint;
  const ink = tone === 'yellow' ? k.yellowInk : k.mintInk;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: 12,
          alignItems: 'flex-start',
          padding: 16,
          borderRadius: tone === 'yellow' ? k.r : k.rSm,
          backgroundColor: bg,
          borderWidth: tone === 'mint' ? 2 : 0,
          borderColor: k.mintLine,
        },
        style,
      ]}>
      <View style={{ marginTop: 2 }}>
        <Icon name={icon} size={22} color={ink} strokeWidth={2.3} />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
