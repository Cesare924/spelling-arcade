import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useApp } from '../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Row, IconBtn, useLook, withCoin } from '../src/components/ui.tsx';
import { KidPicker } from '../src/components/overlays.tsx';
import { SHOW_SUPPORT_LINK } from '../src/config.ts';
import { allWords, trickyWords, dueWords, streak, upcomingTest, whenText, profileOf, plural } from '../src/logic/state.ts';
import { PRIZES, HOME_THEMES } from '../src/data/prizes.ts';
import { goalOf, lookIn } from '../src/logic/prizes.ts';
import { GoalBar, TICKET } from '../src/components/tickets.tsx';

export default function Home() {
  const { ready, root, kid, requirePin } = useApp();
  const { c, f } = useLook();
  const [picker, setPicker] = useState(false);
  const words = allWords(kid);
  const needsSetup = ready && !root.setupDone && words.length === 0 && root.profiles.length === 1;
  useEffect(() => { if (needsSetup) router.replace('/setup'); }, [needsSetup]);

  if (!ready || needsSetup) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={c.brand} /></View>;

  const me = profileOf(root), due = dueWords(kid), test = upcomingTest(kid), days = streak(kid), tricky = trickyWords(kid).length;
  const goal = goalOf(root, kid, root.active), theme = HOME_THEMES[lookIn(kid, 'home')];
  const trophies = PRIZES.filter(p => p.kind === 'trophy' && kid.owned.includes(p.id));
  const waiting = kid.famReq.filter(q => q.st === 'wait');
  const ink = theme?.ink, soft = theme?.soft;
  const grown = (path: '/words' | '/settings' | '/report' | '/help') => requirePin(() => router.push(path));
  return (
    <Screen>
      <Stack.Screen options={{ headerRight: () => <IconBtn icon="❓" label="Help" onPress={() => grown('/help')} /> }} />
      <Card style={{ alignItems: 'center', ...(theme ? { backgroundColor: theme.bg, borderColor: theme.line } : {}) }}>
        {theme && <Text accessibilityElementsHidden importantForAccessibility="no" style={{ position: 'absolute', top: 8, left: 14, right: 14, color: theme.decoColor, fontSize: 14, letterSpacing: 18, opacity: .8 }}>{theme.deco}</Text>}
        <Pressable onPress={() => setPicker(true)} accessibilityRole="button" accessibilityLabel={`${me.name}. Tap to switch kids`} style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 56 }}>{me.avatar}</Text>
          <H style={{ color: ink }}>Hi, {me.name}! 👋</H>
          {root.profiles.length > 1 && <P small style={{ color: soft }}>Tap your picture to switch kids</P>}
        </Pressable>
        <Row style={{ justifyContent: 'center', gap: 14 }}>
          <Mini n={kid.tokens} label="tokens" icon="🪙" ink={ink} soft={soft} />
          <Mini n={kid.tickets} label="tickets" icon="🎟️" ink={ink} soft={soft} />
          <Mini n={days} label="day streak" icon="🔥" ink={ink} soft={soft} />
          <Mini n={words.length} label="words" icon="📚" ink={ink} soft={soft} />
        </Row>
        {trophies.length > 0 && (
          <View accessible accessibilityLabel={`Trophy shelf: ${trophies.map(t => t.name).join(', ')}`}
            style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingTop: 2, borderBottomWidth: 6, borderBottomColor: '#d6a46c', borderRadius: 3 }}>
            {trophies.map(t => <Text key={t.id} style={{ fontSize: 34 }}>{t.em}</Text>)}
          </View>
        )}
        <P small style={{ textAlign: 'center', color: soft }}>Spell words to earn 🪙 tokens. Play games to win 🎟️ tickets!</P>
      </Card>
      {goal && <Card style={{ borderColor: TICKET.line, borderStyle: 'dashed', borderWidth: 2, paddingVertical: 12 }}><GoalBar goal={goal} have={kid.tickets} /></Card>}
      {waiting.length > 0 && (
        <Card style={{ backgroundColor: '#fff7ed', borderColor: '#fdba74', paddingVertical: 12 }}>
          <Text style={{ color: c.ink, fontWeight: '800', fontSize: 15 * f }}>⏳ {waiting.map(q => `${q.em} ${q.name}`).join(', ')}: waiting for a grown-up to OK</Text>
          <Btn small kind="secondary" label="🔒 Grown-up: answer now" onPress={() => requirePin(() => router.push('/family-prizes'))} />
        </Card>
      )}

      {test && (
        <Card style={{ backgroundColor: c.sunSoft, borderColor: c.sun }}>
          <Text style={{ color: c.ink, fontWeight: '800', fontSize: 16 * f }}>📝 Spelling test {whenText(test.d!, test.l.test)}: {test.l.name}</Text>
          <Btn label="Practice test words" onPress={() => router.push({ pathname: '/practice/session', params: { mode: 'list', list: test.l.id } })} />
        </Card>
      )}

      <Btn big label="✏️  Practice spelling" onPress={() => router.push('/practice')} disabled={!words.length} />
      {!words.length && <P style={{ textAlign: 'center' }}>No words yet. A grown-up can add some in My Words.</P>}
      {(due.length > 0 || tricky > 0) && (
        <Row>
          {due.length > 0 && <Tile icon="🔁" label={`Review: ${plural(due.length, 'word')}`}
            onPress={() => router.push({ pathname: '/practice/session', params: { mode: 'due' } })} />}
          {tricky > 0 && <Tile icon="🧠" label={`Tricky words (${tricky})`}
            onPress={() => router.push({ pathname: '/practice/session', params: { mode: 'tricky' } })} />}
        </Row>
      )}
      <Row>
        <Tile big icon="🎮" label="Arcade" bg={c.good} onPress={() => router.push('/arcade')} />
        <Tile big icon="🎁" label="Prizes" bg={TICKET.main} onPress={() => router.push('/prizes')} />
      </Row>
      <Row>
        <Tile icon="📚" label="My Words" onPress={() => grown('/words')} />
        <Tile icon="⚙️" label="Settings" onPress={() => grown('/settings')} />
        <Tile icon="📊" label="Report" onPress={() => grown('/report')} />
      </Row>
      <P small style={{ textAlign: 'center' }}>⭐ {plural(kid.stars, 'star')} earned · {plural(kid.spelled, 'word')} spelled</P>
      {SHOW_SUPPORT_LINK && (
        <P small style={{ textAlign: 'center', marginTop: 8, opacity: .8 }}>
          For grown-ups: Spelling Arcade is free with no ads. If you enjoy it, there's a way to support it in Settings › About & support.
        </P>
      )}
      <KidPicker visible={picker} onClose={() => setPicker(false)} />
    </Screen>
  );
}

function Mini({ n, label, icon, ink, soft }: { n: number; label: string; icon: string; ink?: string; soft?: string }) {
  const { c, f } = useLook();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22 * f, fontWeight: '900', color: ink || c.ink }}>{withCoin(icon, 22 * f)} {n}</Text>
      <Text style={{ color: soft || c.soft, fontSize: 12.5 * f }}>{label}</Text>
    </View>
  );
}

/** Home-screen tile: every tile in a row is the same height, icon above a short label. */
function Tile({ icon, label, onPress, bg, big }: { icon: string; label: string; onPress: () => void; bg?: string; big?: boolean }) {
  const { c, f, hc } = useLook();
  const fg = bg ? '#fff' : c.brandDark;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={({ pressed }) => ({
        flex: 1, minHeight: (big ? 96 : 78) * f, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 6,
        alignItems: 'center', justifyContent: 'center', gap: 4,
        backgroundColor: bg || c.brandSoft, opacity: pressed ? .8 : 1,
        borderWidth: hc ? 2 : 0, borderColor: c.ink,
      })}>
      <Text style={{ fontSize: (big ? 30 : 24) * f }}>{icon}</Text>
      <Text numberOfLines={2} style={{ color: fg, fontSize: (big ? 19 : 15) * f, fontWeight: '800', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}
