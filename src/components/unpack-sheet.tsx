import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  Vibration,
  View,
  useWindowDimensions,
} from 'react-native';

import { openInGallery } from '@/archive/contents';
import { Icon } from '@/components/icon';
import { BigButton, GhostButton, Heading, Label, Note, Sub } from '@/components/ui';
import type { Archive, ArchiveEntry } from '@/data/archives';
import {
  inspectArchive,
  unpackArchive,
  UnpackError,
  type UnpackFailure,
  type UnpackResult,
  type UnpackStage,
} from '@/archive/unpack';
import { useApp } from '@/state/app-state';
import { font } from '@/theme/fonts';
import { INK } from '@/theme/tokens';

type Phase = 'reading' | 'list' | 'saving' | 'done' | 'error';
type SheetError = UnpackFailure | 'empty';

/**
 * The whole point of the app, in steps the user cannot get lost in:
 * see what is inside -> one green button -> a plain-language "it worked".
 * There is no file picker, no destination chooser and no way to half-finish.
 */
export function UnpackSheet({
  archive,
  onClose,
  onSaved,
}: {
  archive: Archive | null;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  if (!archive) return null;
  // Keyed on the archive so opening a different one remounts with fresh state
  // instead of resetting phase and progress from an effect.
  return <Sheet key={archive.id} archive={archive} onClose={onClose} onSaved={onSaved} />;
}

function Sheet({
  archive,
  onClose,
  onSaved,
}: {
  archive: Archive;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const { k, t, fs, settings } = useApp();
  const { width, height } = useWindowDimensions();
  const brutal = k.bw > 0;

  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [phase, setPhase] = useState<Phase>('reading');
  const [progress, setProgress] = useState(0);
  /** Decompression cannot be counted, so it gets a spinner; saving gets the bar. */
  const [stage, setStage] = useState<UnpackStage>('extracting');
  const [result, setResult] = useState<UnpackResult | null>(null);
  const [failure, setFailure] = useState<SheetError | null>(null);

  const [slide] = useState(() => new Animated.Value(height));
  const [pop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(slide, { toValue: 0, duration: 280, useNativeDriver: true }).start();
  }, [slide]);

  useEffect(() => {
    let cancelled = false;
    inspectArchive(archive)
      .then((found) => {
        if (cancelled) return;
        setEntries(found);
        if (found.length === 0) {
          setFailure('empty');
          setPhase('error');
        } else {
          setPhase('list');
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setFailure(error instanceof UnpackError ? error.code : 'unreadable');
        setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [archive]);

  const close = useCallback(() => {
    Animated.timing(slide, { toValue: height, duration: 200, useNativeDriver: true }).start(
      onClose,
    );
  }, [height, onClose, slide]);

  const finish = useCallback(() => {
    setProgress(100);
    setPhase('done');
    onSaved(archive.id);
    if (settings.sounds) {
      // TODO: swap for a short chime once an audio asset exists.
      Vibration.vibrate(80);
    }
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [archive.id, onSaved, pop, settings.sounds]);

  const runSave = useCallback(async () => {
    setPhase('saving');
    setStage('extracting');
    setProgress(0);

    try {
      const saved = await unpackArchive(archive, entries, setStage, (done, total) =>
        setProgress(total > 0 ? Math.round((done / total) * 100) : 100),
      );
      setResult(saved);
      finish();
    } catch (error) {
      setFailure(error instanceof UnpackError ? error.code : 'write-failed');
      setPhase('error');
    }
  }, [archive, entries, finish]);

  const onSavePress = useCallback(() => {
    if (!settings.askBeforeSave) {
      void runSave();
      return;
    }
    Alert.alert(t.confirmTitle, t.confirmBody(entries.length), [
      { text: t.notNow, style: 'cancel' },
      { text: t.confirmYes, onPress: () => void runSave() },
    ]);
  }, [entries.length, runSave, settings.askBeforeSave, t]);

  const errorMessage = (code: SheetError): string => {
    switch (code) {
      case 'needs-password':
        return t.errorPassword;
      case 'gallery-permission':
        return t.errorPermission;
      case 'write-failed':
        return t.errorWrite;
      case 'empty':
        return t.emptyArchive;
      default:
        return t.errorUnreadable;
    }
  };

  const tileWidth = (width - 40 - 24) / 3;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityLabel={t.cancel}
          onPress={close}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.55)',
          }}
        />

        <Animated.View
          style={{
            transform: [{ translateY: slide }],
            maxHeight: height * 0.85,
            backgroundColor: k.surface,
            borderTopWidth: brutal ? 3 : 0,
            borderTopColor: INK,
            borderTopLeftRadius: brutal ? k.r : 28,
            borderTopRightRadius: brutal ? k.r : 28,
            boxShadow: '0 -10px 40px 0 rgba(15,23,42,0.25)',
          }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 26 }}>
            <View
              style={{
                width: 52,
                height: 6,
                borderRadius: k.rPill,
                alignSelf: 'center',
                marginBottom: 16,
                backgroundColor: brutal ? INK : '#CBD5E1',
              }}
            />

            {phase === 'reading' ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', gap: 20 }}>
                <ActivityIndicator size="large" color={brutal ? INK : k.accent} />
                <Heading size={22} style={{ textAlign: 'center' }}>
                  {t.reading}
                </Heading>
                <Sub size={16} style={{ textAlign: 'center' }}>
                  {archive.name}
                </Sub>
              </View>
            ) : null}

            {phase === 'list' ? (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Heading size={22}>{archive.name}</Heading>
                    <Label size={15} style={{ marginTop: 4 }}>
                      {t.inside(entries.length)}
                    </Label>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.cancel}
                    onPress={close}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: brutal ? k.rSm : 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: brutal ? k.accentSoft : '#F8FAFC',
                      borderWidth: brutal ? 3 : 2,
                      borderColor: brutal ? INK : '#E2E8F0',
                    }}>
                    <Icon name="close" size={22} color={k.text} strokeWidth={2.5} />
                  </Pressable>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginTop: 20,
                    marginBottom: 22,
                  }}>
                  {entries.map((file, index) => (
                    <View key={`${file.path}-${index}`} style={{ width: tileWidth }}>
                      <View
                        style={{
                          height: 86,
                          borderRadius: k.rSm,
                          justifyContent: 'flex-end',
                          paddingHorizontal: 10,
                          paddingBottom: 9,
                          backgroundColor: k.tile[file.category],
                          borderWidth: brutal ? 3 : 2,
                          borderColor: brutal ? INK : '#E2E8F0',
                        }}>
                        <Text
                          style={{
                            fontFamily: font(800),
                            fontSize: 13,
                            letterSpacing: 1,
                            color: k.text,
                          }}>
                          {file.label}
                        </Text>
                      </View>
                      <Label size={13.5} weight={600} numberOfLines={1} style={{ marginTop: 7 }}>
                        {file.name}
                      </Label>
                    </View>
                  ))}
                </View>

                <Note icon="check" tone="mint" style={{ marginBottom: 18 }}>
                  <Text
                    style={{
                      fontFamily: font(500),
                      fontSize: fs(16),
                      lineHeight: fs(16) * 1.45,
                      color: k.mintInk,
                    }}>
                    {t.sheetSub}
                  </Text>
                </Note>

                <BigButton label={t.saveAll} icon="download" onPress={onSavePress} />
                <GhostButton label={t.notNow} onPress={close} />
              </View>
            ) : null}

            {phase === 'saving' ? (
              <View style={{ paddingVertical: 26, alignItems: 'center', gap: 20 }}>
                {stage === 'extracting' ? (
                  <>
                    <ActivityIndicator size="large" color={brutal ? INK : k.accent} />
                    <Heading size={22} style={{ textAlign: 'center' }}>
                      {t.extracting}
                    </Heading>
                  </>
                ) : (
                  <>
                    <Icon
                      name="download"
                      size={52}
                      color={brutal ? INK : k.accent}
                      strokeWidth={2.3}
                    />
                    <Heading size={22}>{t.saving}</Heading>
                    <View
                      style={{
                        width: '100%',
                        height: 18,
                        borderRadius: brutal ? k.rSm : 999,
                        overflow: 'hidden',
                        backgroundColor: k.track,
                        borderWidth: k.bw,
                        borderColor: k.borderColor,
                      }}>
                      <View
                        style={{ height: '100%', width: `${progress}%`, backgroundColor: k.action }}
                      />
                    </View>
                    <Label size={15}>{progress}%</Label>
                  </>
                )}
              </View>
            ) : null}

            {phase === 'done' ? (
              <View style={{ paddingTop: 20, paddingBottom: 8, alignItems: 'center', gap: 16 }}>
                <Animated.View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: brutal ? k.rSm : 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: k.mint,
                    borderWidth: 3,
                    borderColor: brutal ? INK : '#A7F3D0',
                    transform: [{ scale: pop }],
                  }}>
                  <Icon name="check" size={46} color={brutal ? INK : '#059669'} strokeWidth={2.7} />
                </Animated.View>
                <Heading size={24} style={{ textAlign: 'center' }}>
                  {t.doneTitle}
                </Heading>
                <Sub size={17} style={{ textAlign: 'center', maxWidth: 320 }}>
                  {t.doneWhere(result?.toGallery ?? 0, result?.toDocuments ?? 0)}
                </Sub>
                {result?.firstAssetId ? (
                  <BigButton
                    label={t.openPhotos}
                    onPress={() => void openInGallery(result.firstAssetId!)}
                    background={brutal ? k.accentSoft : k.accent}
                    ink={brutal ? INK : '#fff'}
                    shadow={k.accentShadow}
                    style={{ marginTop: 6 }}
                  />
                ) : null}
                <BigButton label={t.ok} onPress={close} style={{ marginTop: 6 }} />
              </View>
            ) : null}

            {phase === 'error' ? (
              <View style={{ paddingTop: 12, paddingBottom: 8, alignItems: 'center', gap: 16 }}>
                <View
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: brutal ? k.rSm : 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: k.yellow,
                    borderWidth: brutal ? 3 : 0,
                    borderColor: INK,
                  }}>
                  <Icon name="info" size={44} color={k.yellowInk} strokeWidth={2.4} />
                </View>
                <Heading size={22} style={{ textAlign: 'center' }}>
                  {t.errorTitle}
                </Heading>
                <Sub size={17} style={{ textAlign: 'center', maxWidth: 320 }}>
                  {failure ? errorMessage(failure) : t.errorUnreadable}
                </Sub>
                <BigButton label={t.ok} onPress={close} style={{ marginTop: 6 }} />
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
