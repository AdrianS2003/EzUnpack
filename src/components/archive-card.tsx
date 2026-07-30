import { Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { BigButton, Card, GhostButton, Heading, Label } from '@/components/ui';
import type { Archive } from '@/data/archives';
import { useApp } from '@/state/app-state';
import { font } from '@/theme/fonts';
import { INK } from '@/theme/tokens';

/**
 * One archive, one card, one green button. Everything above the button is
 * there to answer a single question: "do I recognise this file?"
 */
export function ArchiveCard({
  archive,
  onOpen,
  onOpenFolder,
  onDelete,
}: {
  archive: Archive;
  onOpen: () => void;
  onOpenFolder: () => void;
  onDelete: () => void;
}) {
  const { k, t, savedIds } = useApp();
  const brutal = k.bw > 0;
  const saved = savedIds.includes(archive.id);

  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 15, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 78,
            height: 78,
            borderRadius: k.rSm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: brutal ? k.tile.photo : k.accentSoft,
            borderWidth: brutal ? 3 : 2,
            borderColor: k.accentLine,
          }}>
          <Icon name="archive" size={30} color={brutal ? INK : k.accent} />
          <Text
            style={{
              fontFamily: font(800),
              fontSize: 11,
              letterSpacing: 0.8,
              marginTop: 3,
              color: brutal ? INK : k.accent,
            }}>
            {archive.ext}
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Heading size={19}>{archive.name}</Heading>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 9,
              flexWrap: 'wrap',
            }}>
            <Chip text={t.source[archive.source]} />
            {saved ? <Chip text={t.savedTag} tone="mint" /> : null}
          </View>

          <Label size={15} weight={600} style={{ marginTop: 9 }}>
            {t.sizeLabel(archive.sizeBytes)}
          </Label>
        </View>
      </View>

      {/* Once unpacked, seeing the files matters more than unpacking again. */}
      {saved ? (
        <BigButton
          label={t.openFolder}
          icon="folder-check"
          onPress={onOpenFolder}
          minHeight={64}
          style={{ marginTop: 16 }}
        />
      ) : (
        <BigButton
          label={t.unpack}
          icon="download"
          onPress={onOpen}
          minHeight={64}
          style={{ marginTop: 16 }}
        />
      )}

      {saved ? <GhostButton label={t.unpackAgain} onPress={onOpen} /> : null}

      {/* Stacked rather than side by side: full-width targets are hard to miss
          and, more to the point, hard to hit by accident. */}
      <GhostButton label={t.deleteArchive} icon="trash" tone="danger" onPress={onDelete} />
    </Card>
  );
}

function Chip({ text, tone = 'default' }: { text: string; tone?: 'default' | 'mint' }) {
  const { k, fs } = useApp();
  const brutal = k.bw > 0;
  return (
    <View
      style={{
        paddingVertical: 5,
        paddingHorizontal: 11,
        borderRadius: k.rPill,
        backgroundColor: tone === 'mint' ? k.mint : k.chip,
        borderWidth: brutal ? 2 : 0,
        borderColor: INK,
      }}>
      <Text
        style={{
          fontFamily: font(700),
          fontSize: fs(14),
          color: tone === 'mint' ? k.mintInk : k.chipInk,
        }}>
        {text}
      </Text>
    </View>
  );
}
