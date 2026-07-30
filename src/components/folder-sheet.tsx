import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  openItem,
  saveItemToPhone,
  shareItem,
  type ContentItem,
  type Contents,
} from '@/archive/contents';
import { Icon, type IconName } from '@/components/icon';
import { Heading, Label, Note, Sub } from '@/components/ui';
import { useApp } from '@/state/app-state';
import { font } from '@/theme/fonts';
import { INK } from '@/theme/tokens';

/**
 * An unpacked archive, shown as a folder.
 *
 * This is the answer to "where did my files go". Android no longer lets an app
 * drop documents into a folder the user can browse, so instead of sending them
 * somewhere and hoping, the app keeps them and becomes the place you look. Each
 * row says plainly where its file lives, and opens it in whatever app the phone
 * normally uses.
 */
export function FolderSheet({
  contents,
  onClose,
}: {
  contents: Contents | null;
  onClose: () => void;
}) {
  const { k, t, fs } = useApp();
  const insets = useSafeAreaInsets();
  const brutal = k.bw > 0;
  const [busy, setBusy] = useState<string | null>(null);

  const open = useCallback(async (item: ContentItem) => {
    setBusy(item.ref);
    try {
      await openItem(item);
    } catch {
      // Nothing on the phone can open this kind of file; the row simply
      // stays put rather than throwing an error at someone.
    } finally {
      setBusy(null);
    }
  }, []);

  const save = useCallback(
    async (item: ContentItem) => {
      setBusy(item.ref);
      try {
        // Nothing is said when they back out of the folder picker: they know
        // they cancelled, and a dialog confirming it would only be in the way.
        if ((await saveItemToPhone(item)) === 'saved') {
          Alert.alert(t.saveToPhoneDone, undefined, [{ text: t.ok }]);
        }
      } catch {
        Alert.alert(t.errorTitle, t.errorSaveToPhone, [{ text: t.ok }]);
      } finally {
        setBusy(null);
      }
    },
    [t],
  );

  if (!contents) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: k.bg }}>
        <View
          style={{
            paddingTop: insets.top + 14,
            paddingHorizontal: 20,
            paddingBottom: 16,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
            backgroundColor: k.surface,
            borderBottomWidth: brutal ? 3 : 0,
            borderBottomColor: INK,
            boxShadow: k.headShadow,
          }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Heading size={22}>{contents.archiveName}</Heading>
            <Label size={15} style={{ marginTop: 4 }}>
              {t.folderSub(contents.items.length)}
            </Label>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.ok}
            onPress={onClose}
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

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 32,
            gap: 14,
          }}>
          {contents.items.map((item) => (
            <View
              key={item.ref}
              style={{
                gap: 12,
                padding: 14,
                borderRadius: k.r,
                backgroundColor: k.surface,
                borderWidth: k.bw,
                borderColor: k.borderColor,
                boxShadow: k.cardShadow,
                opacity: busy === item.ref ? 0.5 : 1,
              }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.name}
                onPress={() => void open(item)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: k.rSm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: k.tile[item.category],
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
                    {labelFor(item.name)}
                  </Text>
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Heading size={17} numberOfLines={2}>
                    {item.name}
                  </Heading>
                  <Sub size={14} style={{ marginTop: 3 }}>
                    {item.kind === 'gallery' ? t.whereGallery : t.whereApp}
                  </Sub>
                </View>
              </Pressable>

              {/* Photos get neither button: they are already in Photos, which has
                  its own sharing and its own permissions to do it with. */}
              {item.kind === 'file' ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <RowAction
                    icon="send"
                    label={t.sendFile}
                    hint={item.name}
                    onPress={() => void shareItem(item)}
                  />
                  <RowAction
                    icon="download"
                    label={t.saveToPhone}
                    hint={item.name}
                    onPress={() => void save(item)}
                  />
                </View>
              ) : null}
            </View>
          ))}

          <Note icon="info" tone="yellow" style={{ marginTop: 10 }}>
            <Text
              style={{
                fontFamily: font(400),
                fontSize: fs(15),
                lineHeight: fs(15) * 1.45,
                color: k.yellowInk,
              }}>
              {t.folderKeepNote}
            </Text>
          </Note>

          {/* Kept separate from the note above rather than merged into it: one is
              about what survives uninstalling, this one about where an edit goes.
              Two short notes are read; one long one is skipped. */}
          <Note icon="help" tone="mint">
            <Text
              style={{
                fontFamily: font(400),
                fontSize: fs(15),
                lineHeight: fs(15) * 1.45,
                color: k.mintInk,
              }}>
              {t.folderEditNote}
            </Text>
          </Note>
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * One of the two things you can do with a kept file.
 *
 * Written out rather than left as a bare icon: an upward arrow and a downward
 * arrow side by side are a puzzle, and this is the screen where the user is
 * already unsure where anything is going.
 */
function RowAction({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: IconName;
  label: string;
  /** The file name, read out after the verb rather than shown. */
  hint: string;
  onPress: () => void;
}) {
  const { k, fs } = useApp();
  const brutal = k.bw > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${hint}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 10,
        borderRadius: k.rSm,
        backgroundColor: brutal ? k.accentSoft : '#F1F5F9',
        borderWidth: brutal ? 2 : 0,
        borderColor: INK,
        transform: [{ translateY: pressed ? 2 : 0 }],
      })}>
      <Icon name={icon} size={21} color={k.text} strokeWidth={2.3} />
      <Text
        style={{
          fontFamily: font(700),
          fontSize: fs(15.5),
          color: k.text,
          flexShrink: 1,
        }}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function labelFor(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return 'FILE';
  return name.slice(dot + 1).toUpperCase().slice(0, 4);
}
