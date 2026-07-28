// SDK 57 vendors react-navigation inside expo-router; @react-navigation/*
// is no longer a package we can import from directly.
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { useApp } from '@/state/app-state';
import { font } from '@/theme/fonts';
import { INK } from '@/theme/tokens';

const ICONS: Record<string, IconName> = {
  index: 'home',
  guide: 'video',
  settings: 'settings',
};

/**
 * Three tabs, each with a picture and a full word underneath. No badges, no
 * hidden gestures, and a 60px minimum target height.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { k, t, fs } = useApp();
  const insets = useSafeAreaInsets();
  const brutal = k.bw > 0;

  const labels: Record<string, string> = {
    index: t.navHome,
    guide: t.navGuide,
    settings: t.navSettings,
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 6,
        paddingTop: 8,
        paddingHorizontal: 10,
        paddingBottom: Math.max(insets.bottom, 14),
        backgroundColor: k.surface,
        borderTopWidth: brutal ? 3 : 2,
        borderTopColor: brutal ? INK : '#E2E8F0',
      }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? (brutal ? INK : k.accent) : k.muted;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={labels[route.name] ?? route.name}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{
              flex: 1,
              minHeight: 60,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              paddingVertical: 8,
              paddingHorizontal: 4,
              borderRadius: k.rSm,
              backgroundColor: focused && brutal ? k.accentSoft : 'transparent',
            }}>
            <Icon name={ICONS[route.name] ?? 'home'} size={27} color={color} />
            <Text
              numberOfLines={2}
              style={{
                fontFamily: font(brutal ? 800 : 700),
                fontSize: fs(13.5),
                lineHeight: fs(13.5) * 1.15,
                textAlign: 'center',
                textTransform: k.upper,
                color,
              }}>
              {labels[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
