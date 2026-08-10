import { requestPermissionsAsync } from 'expo-media-library';
import { useCallback, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { BigButton, GhostButton, Heading } from '@/components/ui';
import { useApp } from '@/state/app-state';
import { font } from '@/theme/fonts';

/**
 * Shown once, before anything else.
 *
 * Android's own permission dialog is a small grey box with two buttons and no
 * context. Someone who is nervous around phones meets it in the middle of
 * saving their grandchildren's photos and taps "Don't allow" out of caution —
 * and the save fails for a reason they will never connect to that tap. So we
 * explain in our own words first, in our own type sizes, and only then let the
 * system ask.
 *
 * Declining is not a dead end: the app opens anyway, and the unpack flow
 * explains the problem again if it ever matters.
 */
export function PermissionPrimer() {
  const { k, t, fs, onboarded, finishOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const [asking, setAsking] = useState(false);

  const accept = useCallback(async () => {
    setAsking(true);
    try {
      await requestPermissionsAsync(true);
    } catch {
      // A refusal is handled later, where it actually blocks something.
    } finally {
      finishOnboarding();
    }
  }, [finishOnboarding]);

  if (onboarded) return null;

  return (
    <Modal visible animationType="fade" onRequestClose={finishOnboarding}>
      <View style={{ flex: 1, backgroundColor: k.bg }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
            gap: 24,
          }}>
          <View style={{ alignItems: 'center', gap: 20 }}>
            <View
              style={{
                width: 104,
                height: 104,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: k.accentSoft,
                borderWidth: k.bw,
                borderColor: k.borderColor,
              }}>
              <Icon name="folder-check" size={52} color={k.accent} />
            </View>

            <Heading size={26} style={{ textAlign: 'center' }}>
              {t.primerTitle}
            </Heading>
          </View>

          <Text
            style={{
              fontFamily: font(400),
              fontSize: fs(18),
              lineHeight: fs(18) * 1.5,
              color: k.text,
              textAlign: 'center',
            }}>
            {t.primerBody}
          </Text>

          <View>
            <BigButton
              label={t.primerButton}
              icon="check"
              onPress={() => void accept()}
              minHeight={74}
            />
            {!asking ? <GhostButton label={t.primerSkip} onPress={finishOnboarding} /> : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
