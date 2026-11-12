import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/store/AppContext.tsx';
import { C } from '../src/components/ui.tsx';

// Stack navigation gives Android's back button and iOS swipe-back for free.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{
          headerStyle: { backgroundColor: C.bg }, headerTintColor: C.brandDark,
          headerTitleStyle: { fontWeight: '900' }, contentStyle: { backgroundColor: C.bg },
        }}>
          <Stack.Screen name="index" options={{ title: 'Spelling Stars' }} />
          <Stack.Screen name="practice/index" options={{ title: 'Practice' }} />
          <Stack.Screen name="practice/session" options={{ title: 'Spell it!' }} />
          <Stack.Screen name="words" options={{ title: 'My Words' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="arcade" options={{ title: 'Game Arcade' }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
