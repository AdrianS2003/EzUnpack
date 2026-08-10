import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Icon } from '@/components/icon';
import { Heading, Note, Sub } from '@/components/ui';
import { useApp } from '@/state/app-state';
import { font } from '@/theme/fonts';

/**
 * The audience for this app learns by watching, not by reading. Big thumbnails,
 * an obvious play button, and the length up front so nobody fears a lecture.
 */
export default function GuideScreen() {
  const { k, t, fs } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: k.bg }}>
      <AppHeader />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 32 }}>
        <Heading size={24} style={{ marginBottom: 6 }}>
          {t.guideTitle}
        </Heading>
        <Sub size={16.5} style={{ marginBottom: 18 }}>
          {t.guideSub}
        </Sub>

        {/* Said once, up front and in full. The cards below look like videos, so
            without this the first tap is the moment the user learns otherwise —
            and for this audience a tap that does nothing reads as their mistake. */}
        <Note icon="info" tone="yellow" style={{ marginBottom: 22 }}>
          <Text
            style={{
              fontFamily: font(400),
              fontSize: fs(15.5),
              lineHeight: fs(15.5) * 1.45,
              color: k.yellowInk,
            }}>
            {t.guideNotice}
          </Text>
        </Note>

        <View style={{ gap: 18 }}>
          {t.videos.map(([title, sub]) => (
            <Pressable
              key={title}
              accessibilityRole="button"
              accessibilityLabel={`${title}. ${sub}. ${t.videoSoonBadge}`}
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
                  backgroundColor: k.tile.video,
                  borderBottomWidth: k.bw,
                  borderBottomColor: k.borderColor,
                }}>
                {/* A camera, not a play triangle. The triangle is a promise that
                    something will start, and nothing will. */}
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: k.surface,
                    borderWidth: k.bw,
                    borderColor: k.borderColor,
                    boxShadow: '0 4px 14px 0 rgba(15,23,42,0.22)',
                  }}>
                  <Icon name="video" size={30} color={k.muted} strokeWidth={2.2} />
                </View>

                <View
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 12,
                    paddingVertical: 5,
                    paddingHorizontal: 11,
                    borderRadius: k.rPill,
                    backgroundColor: k.chip,
                  }}>
                  <Text
                    style={{
                      fontFamily: font(700),
                      fontSize: fs(13.5),
                      color: k.chipInk,
                    }}>
                    {t.videoSoonBadge}
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
