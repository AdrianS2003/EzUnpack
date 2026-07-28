import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Heading } from '@/components/ui';
import { useApp } from '@/state/app-state';
import { font } from '@/theme/fonts';
import { INK } from '@/theme/tokens';

/** How long the fake recognition runs before it "hears" something. */
const LISTEN_MS = 2200;
const FAKE_RESULT = 'Vacation';

/**
 * Voice search for people who find typing hard. The recognition itself is not
 * wired up yet — this simulates it so the interaction can be tested on real
 * users before we pay for a speech engine.
 */
export function MicOverlay({
  visible,
  onClose,
  onResult,
}: {
  visible: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}) {
  const { k, t } = useApp();
  const brutal = k.bw > 0;
  const [ring] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    ring.setValue(0);
    loop.start();

    const timeout = setTimeout(() => {
      onResult(FAKE_RESULT);
      onClose();
    }, LISTEN_MS);

    return () => {
      loop.stop();
      clearTimeout(timeout);
    };
    // The parent passes stable callbacks; anything else would restart the
    // countdown on every render.
  }, [onClose, onResult, ring, visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15,23,42,0.55)',
        }}>
        <View
          style={{
            width: 312,
            paddingVertical: 32,
            paddingHorizontal: 28,
            alignItems: 'center',
            gap: 18,
            borderRadius: k.r,
            backgroundColor: k.surface,
            borderWidth: k.bw,
            borderColor: k.borderColor,
            boxShadow: brutal ? `6px 6px 0 0 ${INK}` : '0 18px 50px 0 rgba(15,23,42,0.35)',
          }}>
          <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={{
                position: 'absolute',
                width: 96,
                height: 96,
                borderRadius: 999,
                backgroundColor: brutal ? k.mint : '#DBEAFE',
                opacity: ring.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.9, 0, 0] }),
                transform: [
                  { scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.6] }) },
                ],
              }}
            />
            <View
              style={{
                width: 82,
                height: 82,
                borderRadius: brutal ? k.rSm : 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: brutal ? k.action : k.accent,
                borderWidth: k.bw,
                borderColor: k.borderColor,
              }}>
              <Icon name="mic" size={38} color={brutal ? INK : '#fff'} strokeWidth={2.3} />
            </View>
          </View>

          <Heading size={19} style={{ textAlign: 'center' }}>
            {t.listening}
          </Heading>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={{
              width: '100%',
              height: 56,
              borderRadius: k.rSm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: k.surface,
              borderWidth: brutal ? 3 : 2,
              borderColor: brutal ? INK : '#CBD5E1',
            }}>
            <Text style={{ fontFamily: font(700), fontSize: 18, color: k.text }}>{t.cancel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
