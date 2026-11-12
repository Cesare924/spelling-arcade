import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Row, C } from '../src/components/ui.tsx';
import { allWords, trickyWords, dueWords, streak, upcomingTest, whenText, profileOf, plural } from '../src/logic/state.ts';

export default function Home() {
  const { ready, root, kid } = useApp();
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={C.brand} /></View>;

  const me = profileOf(root), words = allWords(kid), due = dueWords(kid), test = upcomingTest(kid), days = streak(kid);
  return (
    <Screen>
      <Card style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 56 }}>{me.avatar}</Text>
        <H>Hi, {me.name}!</H>
        <Row style={{ justifyContent: 'center', gap: 18 }}>
          <Stat n={kid.tokens} label="tokens" icon="🪙" />
          <Stat n={kid.stars} label="stars" icon="⭐" />
          <Stat n={days} label="day streak" icon="🔥" />
        </Row>
      </Card>

      {test && (
        <Card style={{ backgroundColor: '#fef3c7', borderColor: C.sun }}>
          <P style={{ color: C.ink, fontWeight: '700' }}>📝 Test {whenText(test.d!, test.l.test)}: {test.l.name}</P>
          <Btn label="Practice test words" onPress={() => router.push({ pathname: '/practice/session', params: { mode: 'list', list: test.l.id } })} />
        </Card>
      )}

      <Btn big label="✏️  Practice" onPress={() => router.push('/practice')} disabled={!words.length} />
      {!words.length && <P style={{ textAlign: 'center' }}>Add some words first — tap My Words.</P>}
      {due.length > 0 && <Btn kind="secondary" label={`🔁 Review ${plural(due.length, 'word')} due today`}
        onPress={() => router.push({ pathname: '/practice/session', params: { mode: 'due' } })} />}
      <Btn big kind="good" label="🎮  Game Arcade" onPress={() => router.push('/arcade')} />
      <Row>
        <Btn kind="secondary" label="📚 My Words" onPress={() => router.push('/words')} style={{ flex: 1 }} />
        <Btn kind="secondary" label="⚙️ Settings" onPress={() => router.push('/settings')} style={{ flex: 1 }} />
      </Row>
      <P style={{ textAlign: 'center' }}>{plural(words.length, 'word')} this year · {plural(trickyWords(kid).length, 'tricky word')}</P>
    </Screen>
  );
}

function Stat({ n, label, icon }: { n: number; label: string; icon: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '900', color: C.ink }}>{icon} {n}</Text>
      <Text style={{ color: C.soft, fontSize: 13 }}>{label}</Text>
    </View>
  );
}
