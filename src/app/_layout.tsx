// Imported per weight rather than from the package root: the root re-exports
// every style, including italics, and drags ~2 MB of unused fonts into the bundle.
import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular';
import { Archivo_500Medium } from '@expo-google-fonts/archivo/500Medium';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { Archivo_900Black } from '@expo-google-fonts/archivo/900Black';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/error-boundary';
import { PermissionPrimer } from '@/components/permission-primer';
import { TabBar } from '@/components/tab-bar';
import { AppProvider, useApp } from '@/state/app-state';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppProvider>
        {/* Inside the provider on purpose: the screen it falls back to still
            needs the user's language and theme to say anything useful. */}
        <ErrorBoundary>
          <Shell />
        </ErrorBoundary>
      </AppProvider>
    </SafeAreaProvider>
  );
}

function Shell() {
  const { k, ready } = useApp();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Holding the splash until preferences load keeps the app from flashing the
  // wrong language or theme in the first frame.
  if (!ready) return <View style={{ flex: 1, backgroundColor: k.bg }} />;

  return (
    <>
      {/* Follows the theme rather than being fixed: dark icons on a dark header
          would be invisible, and the header is the first thing on every screen. */}
      <StatusBar style={k.bar} />
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: k.bg },
          animation: 'none',
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="guide" />
        <Tabs.Screen name="settings" />
      </Tabs>
      <PermissionPrimer />
    </>
  );
}
