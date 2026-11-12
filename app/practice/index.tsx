import { useState } from 'react';
import { router } from 'expo-router';
import { useApp } from '../../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Chips } from '../../src/components/ui.tsx';
import { allWords, trickyWords, dueWords, curList, plural } from '../../src/logic/state.ts';
import type { Mode, Style } from '../../src/logic/practice.ts';

export default function PracticeChooser() {
  const { kid } = useApp();
  const [style, setStyle] = useState<Style>('spell');
  const L = curList(kid), tricky = trickyWords(kid).length, due = dueWords(kid).length, all = allWords(kid).length;
  const go = (mode: Mode, list?: string) => router.push({ pathname: '/practice/session', params: { mode, style, ...(list ? { list } : {}) } });

  return (
    <Screen>
      <Card>
        <H>How do you want to practice?</H>
        <Chips<Style> value={style} onChange={setStyle} options={[
          { v: 'spell', label: '🎧 Hear & spell' }, { v: 'missing', label: '🧩 Missing letters' }, { v: 'unscramble', label: '🔀 Unscramble' },
        ]} />
      </Card>
      <Card>
        <H>Which words?</H>
        {L && L.words.length > 0 && <Btn label={`📝 This week: ${L.name} (${L.words.length})`} onPress={() => go('list', L.id)} />}
        <Btn kind="secondary" label={`🌈 Year mix (${Math.min(kid.set.mix, all)} words)`} onPress={() => go('year')} disabled={!all} />
        <Btn kind="secondary" label={`🔁 Due for review (${due})`} onPress={() => go('due')} disabled={!due} />
        <Btn kind="secondary" label={`🧠 Tricky words (${tricky})`} onPress={() => go('tricky')} disabled={!tricky} />
        <Btn kind="secondary" label={`📚 Every word this year (${all})`} onPress={() => go('all')} disabled={!all} />
        <P>{plural(kid.lists.length, 'list')} saved. Change lists in My Words.</P>
      </Card>
    </Screen>
  );
}
