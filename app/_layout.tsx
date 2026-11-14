import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/store/AppContext.tsx';
import { PinPad, Toast } from '../src/components/overlays.tsx';
import { useLook } from '../src/components/ui.tsx';

// Stack navigation gives Android's back button and iOS swipe-back for free.
function Nav() {
  const { c } = useLook();
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: c.bg }, headerTintColor: c.brandDark,
        headerTitleStyle: { fontWeight: '900' }, contentStyle: { backgroundColor: c.bg },
      }}>
        <Stack.Screen name="index" options={{ title: 'Spelling Arcade' }} />
        <Stack.Screen name="practice/index" options={{ title: 'Practice' }} />
        <Stack.Screen name="practice/session" options={{ title: 'Spell it!' }} />
        <Stack.Screen name="words" options={{ title: 'My Words' }} />
        <Stack.Screen name="scan" options={{ title: 'Scan a list' }} />
        <Stack.Screen name="settings" options={{ title: 'Grown-up Settings' }} />
        <Stack.Screen name="arcade" options={{ title: 'Game Arcade' }} />
        <Stack.Screen name="game" options={{ headerShown: false, contentStyle: { backgroundColor: '#1e1b4b' } }} />
        <Stack.Screen name="report" options={{ title: 'Progress report' }} />
        <Stack.Screen name="help" options={{ title: 'Help' }} />
        <Stack.Screen name="setup" options={{ title: 'Welcome', headerBackVisible: false, gestureEnabled: false }} />
      </Stack>
      <PinPad />
      <Toast />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Nav />
      </AppProvider>
    </SafeAreaProvider>
  );
}
