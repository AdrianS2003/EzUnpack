import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { measureStorage, sweepLeftovers, type Storage } from '@/archive/storage';
import { AppHeader } from '@/components/app-header';
import { BigButton, Card, Heading, Segmented, Sub, Toggle } from '@/components/ui';
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

        <StorageCard />
      </ScrollView>
    </View>
  );
}

/** Nothing to report is friendlier than an error about a folder that is not there. */
function read(): Storage | null {
  try {
    return measureStorage();
  } catch {
    return null;
  }
}

/**
 * How much room the app takes, and the one thing the user can do about it here.
 *
 * Deleting an archive already takes its files with it, so this is not a second
 * way to delete things — it only offers back what nothing points at any more.
 * The number is measured rather than remembered, because a count kept in
 * preferences would quietly drift away from the truth on disk.
 */
function StorageCard() {
  const { t } = useApp();
  const [storage, setStorage] = useState<Storage | null>(read);

  const measure = useCallback(() => setStorage(read()), []);

  // The tabs stay mounted, so without this the number would still show what was
  // true the first time this screen was opened — including archives deleted on
  // the home screen since.
  useFocusEffect(measure);

  const clean = useCallback(() => {
    if (!storage || storage.leftover.length === 0) return;
    Alert.alert(t.storageTitle, t.storageLeftover(storage.leftoverBytes), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.storageCleanYes,
        style: 'destructive',
        onPress: () => {
          const freed = sweepLeftovers(storage.leftover);
          measure();
          Alert.alert(t.storageTitle, t.storageDone(freed), [{ text: t.ok }]);
        },
      },
    ]);
  }, [measure, storage, t]);

  if (!storage) return null;

  const hasLeftovers = storage.leftover.length > 0;

  return (
    <Card style={{ marginTop: 22 }}>
      <Heading size={18}>{t.storageTitle}</Heading>
      <Sub size={15} style={{ marginTop: 6 }}>
        {t.storageBody(storage.bytes)}
      </Sub>
      <Sub size={15} style={{ marginTop: 10 }}>
        {hasLeftovers ? t.storageLeftover(storage.leftoverBytes) : t.storageTidy}
      </Sub>

      {hasLeftovers ? (
        <BigButton
          label={t.storageClean(storage.leftoverBytes)}
          icon="trash"
          onPress={clean}
          minHeight={64}
          style={{ marginTop: 16 }}
        />
      ) : null}
    </Card>
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
