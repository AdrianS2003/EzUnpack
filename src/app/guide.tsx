import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Icon } from '@/components/icon';
import { Heading, Sub } from '@/components/ui';
import { useApp } from '@/state/app-state';
import { font } from '@/theme/fonts';
import { INK } from '@/theme/tokens';

/**
 * The audience for this app learns by watching, not by reading. Big thumbnails,
 * an obvious play button, and the length up front so nobody fears a lecture.
 */
export default function GuideScreen() {
  const { k, t, fs } = useApp();
  const brutal = k.bw > 0;

  return (
    <View style={{ flex: 1, backgroundColor: k.bg }}>
      <AppHeader />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 32 }}>
        <Heading size={24} style={{ marginBottom: 6 }}>
          {t.guideTitle}
        </Heading>
        <Sub size={16.5} style={{ marginBottom: 20 }}>
          {t.guideSub}
        </Sub>

        <View style={{ gap: 18 }}>
          {t.videos.map(([title, sub, length]) => (
            <Pressable
              key={title}
              accessibilityRole="button"
              accessibilityLabel={`${title}. ${sub}. ${length}`}
              onPress={() => Alert.alert(t.videoSoonTitle, t.videoSoonBody, [{ text: t.ok }])}
              style={({ pressed }) => ({
                overflow: 'hidden',
                borderRadius: k.r,
                backgroundColor: k.surface,
                borderWidth: k.bw,
                borderColor: k.borderColor,
                boxShadow: pressed ? 'none' : k.cardShadow,
                transform: [{ translateY: pressed ? 2 : 0 }],
              })}>
              <View
                style={{
                  height: 152,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: brutal ? k.tile.video : '#CBD5E1',
                  borderBottomWidth: k.bw,
                  borderBottomColor: k.borderColor,
                }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: brutal ? k.rSm : 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    borderWidth: k.bw,
                    borderColor: k.borderColor,
                    boxShadow: brutal ? `3px 3px 0 0 ${INK}` : '0 4px 14px 0 rgba(15,23,42,0.22)',
                  }}>
                  <Icon name="play" size={30} color={brutal ? INK : k.accent} />
                </View>

                <View
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 12,
                    paddingVertical: 4,
                    paddingHorizontal: 9,
                    borderRadius: k.rSm,
                    backgroundColor: brutal ? '#fff' : 'rgba(15,23,42,0.85)',
                    borderWidth: brutal ? 2 : 0,
                    borderColor: INK,
                  }}>
                  <Text
                    style={{
                      fontFamily: font(700),
                      fontSize: fs(13),
                      color: brutal ? INK : '#fff',
                    }}>
                    {length}
                  </Text>
                </View>
              </View>

              <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 }}>
                <Heading size={19}>{title}</Heading>
                <Sub style={{ marginTop: 4 }}>{sub}</Sub>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
