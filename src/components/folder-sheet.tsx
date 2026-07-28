import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openItem, shareItem, type ContentItem, type Contents } from '@/archive/contents';
import { Icon } from '@/components/icon';
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
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
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
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
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

              {/* Photos are shared from the gallery, which already has the
                  button and the permissions for it. */}
              {item.kind === 'file' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t.sendFile} ${item.name}`}
                  onPress={() => void shareItem(item)}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: k.rSm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: brutal ? k.accentSoft : '#F1F5F9',
                    borderWidth: brutal ? 2 : 0,
                    borderColor: INK,
                  }}>
                  <Icon name="send" size={22} color={k.text} strokeWidth={2.3} />
                </Pressable>
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
        </ScrollView>
      </View>
    </Modal>
  );
}

function labelFor(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return 'FILE';
  return name.slice(dot + 1).toUpperCase().slice(0, 4);
}
