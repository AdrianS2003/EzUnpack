import { useShareIntent } from 'expo-share-intent';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { readContents, type Contents } from '@/archive/contents';
import { subscribeIncoming, takeIncomingUri } from '@/archive/incoming';
import { archiveFormatOf } from '@/archive/kinds';
import { deleteArchive, importArchive, listArchives } from '@/archive/library';
import { pickArchive } from '@/archive/pick';
import { folderFor } from '@/archive/unpack';
import { FolderSheet } from '@/components/folder-sheet';
import { AppHeader } from '@/components/app-header';
import { ArchiveCard } from '@/components/archive-card';
import { Icon, type IconName } from '@/components/icon';
import { BigButton, Heading, Label, Note, Sub } from '@/components/ui';
import { UnpackSheet } from '@/components/unpack-sheet';
import type { Archive, ArchiveSource } from '@/data/archives';
import { listen } from '@/speech';
import { useApp } from '@/state/app-state';
import { font } from '@/theme/fonts';
import { INK } from '@/theme/tokens';

type Filter = 'all' | 'new' | 'saved';

/** Share intents hand over bare paths; the file APIs want a scheme. */
function asFileUri(path: string): string {
  if (path.startsWith('file://') || path.startsWith('content://')) return path;
  return `file://${path}`;
}

export default function HomeScreen() {
  const { k, t, fs, lang, savedIds, markSaved, forgetSaved } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  /** Everything in our archive folder, newest first. Read once on mount. */
  const [archives, setArchives] = useState<Archive[]>(() => listArchives());

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return archives.filter((archive) => {
      if (needle && !archive.name.toLowerCase().includes(needle)) return false;
      if (filter === 'new') return !savedIds.includes(archive.id);
      if (filter === 'saved') return savedIds.includes(archive.id);
      return true;
    });
  }, [archives, filter, query, savedIds]);

  const newCount = archives.filter((a) => !savedIds.includes(a.id)).length;
  const open = useMemo<Archive | null>(
    () => archives.find((a) => a.id === openId) ?? null,
    [archives, openId],
  );

  const toggleFilter = useCallback(
    (next: Filter) => setFilter((current) => (current === next ? 'all' : next)),
    [],
  );

  /**
   * Takes our own copy of an incoming file, puts it at the top of the feed and
   * opens it. Everything that can hand us an archive funnels through here.
   */
  const receive = useCallback(
    (uri: string, source: ArchiveSource, name?: string) => {
      if (name && !archiveFormatOf(name)) {
        Alert.alert(t.errorTitle, t.errorNotArchive, [{ text: t.ok }]);
        return;
      }
      try {
        const archive = importArchive(uri, source, name);
        setArchives((current) => [archive, ...current.filter((a) => a.id !== archive.id)]);
        setFilter('all');
        setQuery('');
        setOpenId(archive.id);
      } catch {
        Alert.alert(t.errorTitle, t.errorImport, [{ text: t.ok }]);
      }
    },
    [t],
  );

  /**
   * Throws away our copy of an archive and everything unpacked from it. Asked
   * about first, because this is the only thing in the app that destroys
   * anything, and the confirmation is where the user is told the one fact they
   * actually care about: their photos are not going anywhere.
   */
  const removeArchive = useCallback(
    (archive: Archive) => {
      Alert.alert(t.deleteTitle, t.deleteBody(archive.name), [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.deleteYes,
          style: 'destructive',
          onPress: () => {
            try {
              deleteArchive(archive);
            } catch {
              Alert.alert(t.errorTitle, t.errorDelete, [{ text: t.ok }]);
              return;
            }
            setArchives((current) => current.filter((a) => a.id !== archive.id));
            forgetSaved(archive.id);
            // Deleting is only reachable from the feed, but a sheet left open on
            // a gone archive would read from a file that no longer exists.
            setOpenId((current) => (current === archive.id ? null : current));
          },
        },
      ]);
    },
    [forgetSaved, t],
  );

  const openPicker = useCallback(async () => {
    const picked = await pickArchive();
    if (picked) receive(picked.uri, 'picked', picked.name);
  }, [receive]);

  // "Share to EzUnpack" from WhatsApp, Gmail, Files...
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const handledShare = useRef<string | null>(null);

  useEffect(() => {
    if (!hasShareIntent) return;
    const file = shareIntent.files?.[0];
    if (!file) return;
    // The hook keeps reporting the same intent until it is reset; the ref stops
    // us from re-opening the sheet on every render in between.
    if (handledShare.current === file.path) return;
    handledShare.current = file.path;
    receive(asFileUri(file.path), 'shared', file.fileName);
    resetShareIntent();
  }, [hasShareIntent, receive, resetShareIntent, shareIntent]);

  // "Open with -> EzUnpack". The file is parked by +native-intent, which runs
  // before this screen exists, so we both subscribe and sweep up on mount.
  useEffect(() => {
    const consume = () => {
      const uri = takeIncomingUri();
      if (uri) receive(uri, 'opened');
    };
    const unsubscribe = subscribeIncoming(consume);
    const handle = setTimeout(consume, 0);
    return () => {
      clearTimeout(handle);
      unsubscribe();
    };
  }, [receive]);

  /** The unpacked contents currently on screen, or null when the view is shut. */
  const [folder, setFolder] = useState<Contents | null>(null);

  const showFolder = useCallback(
    (archive: Archive) => {
      const contents = readContents(folderFor(archive));
      // No manifest means it was never unpacked — send them through the sheet.
      if (contents) setFolder(contents);
      else setOpenId(archive.id);
    },
    [],
  );

  // Stable so the sheets never remount mid-interaction.
  const closeSheet = useCallback(() => setOpenId(null), []);
  const closeFolder = useCallback(() => setFolder(null), []);

  /**
   * Hands the microphone to the phone's own speech dialog and puts whatever it
   * heard into the search box. Nothing is said when the user simply backs out
   * of the dialog — they know they cancelled — but a phone that cannot listen
   * at all has to say so, or the button looks broken.
   */
  const search = useCallback(async () => {
    const heard = await listen(lang, t.listening);
    if (heard.status === 'heard') {
      setFilter('all');
      setQuery(heard.text);
    } else if (heard.status === 'unavailable') {
      Alert.alert(t.errorTitle, t.errorNoVoice, [{ text: t.ok }]);
    }
  }, [lang, t]);

  const feedTitle = filter === 'new' ? t.feedNew : filter === 'saved' ? t.feedSaved : t.feed;

  return (
    <View style={{ flex: 1, backgroundColor: k.bg }}>
      <AppHeader showSearch query={query} onQuery={setQuery} onMic={() => void search()} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled">
        <Heading size={21}>{t.quick}</Heading>

        {/* The only action that touches a real file today, so it leads. */}
        <BigButton
          label={t.openFile}
          icon="archive-down"
          onPress={() => void openPicker()}
          background={k.bw > 0 ? k.accentSoft : k.accent}
          ink={k.bw > 0 ? INK : '#fff'}
          shadow={k.accentShadow}
          style={{ marginTop: 14 }}
        />
        <Sub size={15} style={{ marginTop: 8, textAlign: 'center' }}>
          {t.openFileSub}
        </Sub>

        <View style={{ flexDirection: 'row', gap: 14, marginTop: 22, marginBottom: 28 }}>
          <QuickAction
            icon="archive-down"
            title={t.newArchives}
            sub={t.newArchivesSub}
            tone="mint"
            badge={newCount > 0 ? newCount : undefined}
            active={filter === 'new'}
            onPress={() => toggleFilter('new')}
          />
          <QuickAction
            icon="folder-check"
            title={t.savedFiles}
            sub={t.savedFilesSub}
            tone="yellow"
            active={filter === 'saved'}
            onPress={() => toggleFilter('saved')}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 14,
          }}>
          <Heading size={21} style={{ flexShrink: 1 }}>
            {feedTitle}
          </Heading>
          <Label size={15}>{t.found(list.length)}</Label>
        </View>

        <View style={{ gap: 18 }}>
          {list.map((archive) => (
            <ArchiveCard
              key={archive.id}
              archive={archive}
              onOpen={() => setOpenId(archive.id)}
              onOpenFolder={() => showFolder(archive)}
              onDelete={() => removeArchive(archive)}
            />
          ))}
        </View>

        {list.length === 0 ? (
          <EmptyState
            title={
              archives.length === 0
                ? t.emptyFeedTitle
                : query.trim()
                  ? t.emptySearchTitle
                  : filter === 'saved'
                    ? t.emptySavedTitle
                    : t.emptyNewTitle
            }
            body={
              archives.length === 0
                ? t.emptyFeedSub
                : query.trim()
                  ? t.emptySearchSub
                  : filter === 'saved'
                    ? t.emptySavedSub
                    : t.emptyNewSub
            }
          />
        ) : null}

        {filter !== 'all' || query.trim() ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFilter('all');
              setQuery('');
            }}
            style={{ paddingVertical: 18, alignItems: 'center' }}>
            <Text style={{ fontFamily: font(700), fontSize: fs(17), color: k.accent }}>
              {t.showAll}
            </Text>
          </Pressable>
        ) : null}

        <Note icon="info" tone="yellow" style={{ marginTop: 24 }}>
          <Text
            style={{
              fontFamily: font(400),
              fontSize: fs(15.5),
              lineHeight: fs(15.5) * 1.45,
              color: k.yellowInk,
            }}>
            {t.hint}
          </Text>
        </Note>
      </ScrollView>

      <UnpackSheet archive={open} onClose={closeSheet} onSaved={markSaved} />
      <FolderSheet contents={folder} onClose={closeFolder} />
    </View>
  );
}

/** The two big shortcuts at the top of the home screen. */
function QuickAction({
  icon,
  title,
  sub,
  tone,
  badge,
  active,
  onPress,
}: {
  icon: IconName;
  title: string;
  sub: string;
  tone: 'mint' | 'yellow';
  badge?: number;
  active: boolean;
  onPress: () => void;
}) {
  const { k, fs } = useApp();
  const brutal = k.bw > 0;
  const background = brutal ? (tone === 'mint' ? k.mint : k.yellow) : k.surface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${title}. ${sub}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 140,
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderRadius: k.r,
        backgroundColor: active && !brutal ? k.accentSoft : background,
        borderWidth: brutal ? 3 : active ? 3 : 0,
        borderColor: brutal ? INK : k.accent,
        boxShadow: pressed ? 'none' : k.cardShadow,
        transform: [{ translateY: pressed ? 2 : 0 }],
      })}>
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: k.rSm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: brutal ? '#FFFFFF' : tone === 'mint' ? k.accentSoft : '#ECFDF5',
          borderWidth: k.bw,
          borderColor: k.borderColor,
        }}>
        <Icon
          name={icon}
          size={26}
          color={brutal ? INK : tone === 'mint' ? k.accent : k.action}
        />
      </View>

      <View style={{ marginTop: 12 }}>
        <Heading size={18}>{title}</Heading>
        <Sub style={{ marginTop: 4 }}>{sub}</Sub>
      </View>

      {badge !== undefined ? (
        <View
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            minWidth: 34,
            height: 34,
            paddingHorizontal: 9,
            borderRadius: k.rPill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: k.danger,
            borderWidth: k.bw,
            borderColor: k.borderColor,
          }}>
          <Text style={{ fontFamily: font(800), fontSize: fs(16), color: '#fff' }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  const { k } = useApp();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 34, gap: 12 }}>
      <Icon name="archive" size={54} color={k.muted} strokeWidth={2} />
      <Heading size={19} style={{ textAlign: 'center' }}>
        {title}
      </Heading>
      <Sub size={16} style={{ textAlign: 'center', maxWidth: 300 }}>
        {body}
      </Sub>
    </View>
  );
}
