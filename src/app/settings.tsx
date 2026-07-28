import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Heading, Segmented, Sub, Toggle } from '@/components/ui';
import type { Lang } from '@/i18n/strings';
import { useApp, type Settings } from '@/state/app-state';
import type { ThemeName } from '@/theme/tokens';

const TOGGLE_KEYS: (keyof Settings)[] = ['bigText', 'sounds', 'askBeforeSave'];

export default function SettingsScreen() {
  const { k, t, lang, setLang, theme, setTheme, settings, setSetting } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: k.bg }}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled">
        <Heading size={24} style={{ marginBottom: 20 }}>
          {t.settingsTitle}
        </Heading>

        <View
          style={{
            overflow: 'hidden',
            borderRadius: k.r,
            backgroundColor: k.surface,
            borderWidth: k.bw,
            borderColor: k.borderColor,
            boxShadow: k.cardShadow,
          }}>
          <Row label={t.langRow} sub={t.langRowSub}>
            <Segmented
              options={[
                { key: 'en', label: 'EN' },
                { key: 'ro', label: 'RO' },
              ]}
              value={lang}
              onChange={(key) => setLang(key as Lang)}
            />
          </Row>

          <Row label={t.look} sub={t.lookSub}>
            <Segmented
              options={[
                { key: 'minimal', label: t.minimal },
                { key: 'brutal', label: t.brutal },
              ]}
              value={theme}
              onChange={(key) => setTheme(key as ThemeName)}
            />
          </Row>

          {t.toggles.map(([label, sub], index) => {
            const key = TOGGLE_KEYS[index];
            const last = index === TOGGLE_KEYS.length - 1;
            return (
              <Row key={key} label={label} sub={sub} last={last}>
                <Toggle
                  label={label}
                  value={settings[key]}
                  onChange={(next) => setSetting(key, next)}
                />
              </Row>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  sub,
  children,
  last = false,
}: {
  label: string;
  sub: string;
  children: ReactNode;
  last?: boolean;
}) {
  const { k } = useApp();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        paddingHorizontal: 18,
        paddingVertical: 20,
        borderBottomWidth: last ? 0 : k.bw > 0 ? 3 : 2,
        borderBottomColor: k.divider,
      }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Heading size={18}>{label}</Heading>
        <Sub style={{ marginTop: 4 }}>{sub}</Sub>
      </View>
      {children}
    </View>
  );
}
