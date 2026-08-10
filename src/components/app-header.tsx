import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Heading } from '@/components/ui';
import { useApp } from '@/state/app-state';
import { font } from '@/theme/fonts';

/**
 * Sits above every screen: the app's name, and a search box only where there is
 * something to search. Language lives in Settings — a control the user touches
 * once does not earn a permanent place on every screen.
 */
export function AppHeader({
  query,
  onQuery,
  onMic,
  showSearch = false,
}: {
  query?: string;
  onQuery?: (value: string) => void;
  onMic?: () => void;
  showSearch?: boolean;
}) {
  const { k, t, fs } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top + 14,
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 13,
        backgroundColor: k.surface,
        borderBottomWidth: k.bw,
        borderBottomColor: k.borderColor,
        boxShadow: k.headShadow,
        zIndex: 2,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: k.rSm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: k.accent,
            borderWidth: k.bw,
            borderColor: k.borderColor,
          }}>
          <Icon name="archive" size={26} color="#FFFFFF" />
        </View>
        <Heading size={25} numberOfLines={1}>
          EzUnpack
        </Heading>
      </View>

      {showSearch ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            minHeight: 62,
            paddingLeft: 15,
            paddingRight: 8,
            borderRadius: k.rSm,
            backgroundColor: k.sunken,
            borderWidth: 2,
            borderColor: k.line,
          }}>
          <Icon name="search" size={22} color={k.muted} strokeWidth={2.3} />
          <TextInput
            value={query}
            onChangeText={onQuery}
            placeholder={t.search}
            placeholderTextColor={k.muted}
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: font(500),
              fontSize: fs(18),
              color: k.text,
              paddingVertical: 8,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.listening}
            onPress={onMic}
            style={{
              width: 52,
              height: 52,
              borderRadius: k.rSm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: k.accent,
              borderWidth: k.bw,
              borderColor: k.borderColor,
            }}>
            <Icon name="mic" size={24} color="#FFFFFF" strokeWidth={2.3} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
