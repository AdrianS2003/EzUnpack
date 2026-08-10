import { Component, useCallback, type ErrorInfo, type ReactNode } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { BigButton, GhostButton, Heading, Sub } from '@/components/ui';
import { useApp } from '@/state/app-state';
import { openReport } from '@/support';
import { INK } from '@/theme/tokens';

/**
 * The screen shown instead of the app vanishing.
 *
 * Without this, an unexpected error in release closes the app outright: no
 * message, no explanation, and — worse for us — no report, because the person it
 * happened to has no idea what to say about it. For an audience that already
 * suspects the phone is against them, an app that disappears mid-task reads as
 * their own mistake.
 *
 * So the screen does two things. It says the loss is not theirs and nothing is
 * gone, and it offers to write the message for them. Nothing is sent by the app:
 * their mail app opens with the details already filled in, and they decide.
 */
function CrashScreen({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { k, t } = useApp();
  const insets = useSafeAreaInsets();
  const brutal = k.bw > 0;

  const report = useCallback(async () => {
    const opened = await openReport(t.crashMailSubject, t.crashMailPrompt, error);
    if (!opened) Alert.alert(t.crashTitle, t.crashNoMail, [{ text: t.ok }]);
  }, [error, t]);

  return (
    <View style={{ flex: 1, backgroundColor: k.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 32,
          gap: 18,
          alignItems: 'center',
        }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: brutal ? k.rSm : 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: k.yellow,
            borderWidth: brutal ? 3 : 0,
            borderColor: INK,
          }}>
          <Icon name="info" size={48} color={k.yellowInk} strokeWidth={2.4} />
        </View>

        <Heading size={25} style={{ textAlign: 'center' }}>
          {t.crashTitle}
        </Heading>

        <Sub size={17} style={{ textAlign: 'center', maxWidth: 330 }}>
          {t.crashBody}
        </Sub>

        <View style={{ width: '100%', maxWidth: 380, marginTop: 6 }}>
          <BigButton label={t.crashSend} icon="send" onPress={() => void report()} />
          <GhostButton label={t.crashRetry} onPress={onRetry} />
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Catches render errors below it and shows [CrashScreen] in their place.
 *
 * It has to be a class: `getDerivedStateFromError` has no hook equivalent. Only
 * errors thrown while rendering reach it — something failing inside a callback
 * or a promise does not — which is why the work that can genuinely fail
 * (extracting, saving, opening) catches its own and says so in words the user
 * can act on. This is the net under everything else.
 *
 * It belongs inside `AppProvider`, so the screen it renders still has the
 * user's language and theme to work with.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Goes nowhere in release, where there is no console attached — but in
    // development this is the difference between a stack trace and a shrug.
    console.error('EzUnpack crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error == null) return this.props.children;
    return (
      <CrashScreen error={this.state.error} onRetry={() => this.setState({ error: null })} />
    );
  }
}
