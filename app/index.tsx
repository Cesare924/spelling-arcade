import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useApp } from '../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Row, IconBtn, useLook } from '../src/components/ui.tsx';
import { KidPicker } from '../src/components/overlays.tsx';
import { SHOW_SUPPORT_LINK } from '../src/config.ts';
import { allWords, trickyWords, dueWords, streak, upcomingTest, whenText, profileOf, plural } from '../src/logic/state.ts';

export default function Home() {
  const { ready, root, kid, requirePin } = useApp();
  const { c, f } = useLook();
  const [picker, setPicker] = useState(false);
  const words = allWords(kid);
  const needsSetup = ready && !root.setupDone && words.length === 0 && root.profiles.length === 1;
  useEffect(() => { if (needsSetup) router.replace('/setup'); }, [needsSetup]);

  if (!ready || needsSetup) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={c.brand} /></View>;

  const me = profileOf(root), due = dueWords(kid), test = upcomingTest(kid), days = streak(kid), tricky = trickyWords(kid).length;
  const grown = (path: '/words' | '/settings' | '/report' | '/help') => requirePin(() => router.push(path));
  return (
    <Screen>
      <Stack.Screen options={{ headerRight: () => <IconBtn icon="❓" label="Help" onPress={() => grown('/help')} /> }} />
      <Card style={{ alignItems: 'center' }}>
        <Pressable onPress={() => setPicker(true)} accessibilityRole="button" accessibilityLabel={`${me.name}. Tap to switch kids`} style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 56 }}>{me.avatar}</Text>
          <H>Hi, {me.name}! 👋</H>
          {root.profiles.length > 1 && <P small>Tap your picture to switch kids</P>}
        </Pressable>
        <Row style={{ justifyContent: 'center', gap: 18 }}>
          <Mini n={kid.tokens} label="tokens" icon="🪙" />
          <Mini n={days} label="day streak" icon="🔥" />
          <Mini n={words.length} label="words" icon="📚" />
        </Row>
        <P small style={{ textAlign: 'center' }}>Spell a word right to earn 🪙 1 token. Spend tokens in the Game Arcade!</P>
      </Card>

      {test && (
        <Card style={{ backgroundColor: c.sunSoft, borderColor: c.sun }}>
          <Text style={{ color: c.ink, fontWeight: '800', fontSize: 16 * f }}>📝 Spelling test {whenText(test.d!, test.l.test)}: {test.l.name}</Text>
          <Btn label="Practice test words" onPress={() => router.push({ pathname: '/practice/session', params: { mode: 'list', list: test.l.id } })} />
        </Card>
      )}

      <Btn big label="✏️  Practice spelling" onPress={() => router.push('/practice')} disabled={!words.length} />
      {!words.length && <P style={{ textAlign: 'center' }}>No words yet. A grown-up can add some in My Words.</P>}
      {due.length > 0 && <Btn kind="secondary" label={`🔁 Review time: ${plural(due.length, 'word')}`}
        onPress={() => router.push({ pathname: '/practice/session', params: { mode: 'due' } })} />}
      {tricky > 0 && <Btn kind="secondary" label={`🧠 Tricky words (${tricky})`}
        onPress={() => router.push({ pathname: '/practice/session', params: { mode: 'tricky' } })} />}
      <Btn big kind="good" label="🎮  Game Arcade" onPress={() => router.push('/arcade')} />
      <Row>
        <Btn kind="secondary" label="📚 My Words" onPress={() => grown('/words')} style={{ flex: 1 }} />
        <Btn kind="secondary" label="⚙️ Settings" onPress={() => grown('/settings')} style={{ flex: 1 }} />
      </Row>
      <Btn kind="ghost" label="📊 Progress report" onPress={() => grown('/report')} />
      <P small style={{ textAlign: 'center' }}>⭐ {plural(kid.stars, 'star')} earned · {plural(kid.spelled, 'word')} spelled</P>
      {SHOW_SUPPORT_LINK && (
        <P small style={{ textAlign: 'center', marginTop: 8, opacity: .8 }}>
          For grown-ups: Spelling Stars is free with no ads. If you enjoy it, there's a way to support it in Settings › About & support.
        </P>
      )}
      <KidPicker visible={picker} onClose={() => setPicker(false)} />
    </Screen>
  );
}

function Mini({ n, label, icon }: { n: number; label: string; icon: string }) {
  const { c, f } = useLook();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 26 * f, fontWeight: '900', color: c.ink }}>{icon} {n}</Text>
      <Text style={{ color: c.soft, fontSize: 13 * f }}>{label}</Text>
    </View>
  );
}
