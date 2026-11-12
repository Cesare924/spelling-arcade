import { useState } from 'react';
import { router } from 'expo-router';
import { useApp } from '../../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Chips } from '../../src/components/ui.tsx';
import { allWords, trickyWords, dueWords, curList, upcomingTest, whenText, plural } from '../../src/logic/state.ts';
import type { Mode, Style } from '../../src/logic/practice.ts';

export default function PracticeChooser() {
  const { kid } = useApp();
  const [style, setStyle] = useState<Style>('spell');
  const all = allWords(kid), MIX = kid.set.mix, L = curList(kid), t = upcomingTest(kid);
  const tricky = trickyWords(kid).length, due = dueWords(kid).length;
  const go = (mode: Mode, list?: string) => router.push({ pathname: '/practice/session', params: { mode, style, ...(list ? { list } : {}) } });
  const shown = new Set<string>();
  if (t) shown.add(t.l.id);
  const showCur = !!L && L.words.length > 0 && !shown.has(L.id);
  if (L) shown.add(L.id);
  const older = kid.lists.filter(l => l.words.length && !shown.has(l.id)).sort((a, b) => b.created - a.created);

  if (!all.length) return <Screen><Card><H>No words yet</H><P>A grown-up can add words in My Words.</P></Card></Screen>;
  return (
    <Screen>
      <Card>
        <H>How do you want to practice?</H>
        <Chips<Style> value={style} onChange={setStyle} options={[
          { v: 'spell', label: '✏️ Spell' }, { v: 'unscramble', label: '🔀 Unscramble' }, { v: 'missing', label: '🧩 Missing letters' },
        ]} />
      </Card>
      {t && <Btn big label={`📝 ${t.l.name} · test ${whenText(t.d!, t.l.test)}!`} onPress={() => go('list', t.l.id)} />}
      {showCur && <Btn big label={`📅 ${L!.name} (${L!.words.length})`} onPress={() => go('list', L!.id)} />}
      {due > 0 && <Btn kind="secondary" label={`⏰ Review time: ${plural(due, 'word')} ready today`} onPress={() => go('due')} />}
      <Btn kind="sky" label={all.length > MIX ? `🌎 Whole-year mix (${MIX} of ${all.length}, missed words first)` : `🌎 Whole-year mix (all ${all.length})`} onPress={() => go('year')} />
      {tricky > 0 && <Btn kind="secondary" label={`🎯 Tricky words (${tricky})`} onPress={() => go('tricky')} />}
      {all.length > MIX && <Btn kind="ghost" label={`🏔️ Every word this year (${all.length})`} onPress={() => go('all')} />}
      {older.length > 0 && (
        <Card>
          <H>📚 Practice another list</H>
          {older.map(l => <Btn key={l.id} kind="secondary" small label={`${l.name} (${l.words.length})`} onPress={() => go('list', l.id)} />)}
        </Card>
      )}
    </Screen>
  );
}
