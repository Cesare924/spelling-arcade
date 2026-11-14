import { Text, View } from 'react-native';
import { useApp } from '../src/store/AppContext.tsx';
import { GrownUpOnly } from '../src/components/GrownUpOnly.tsx';
import { Screen, Card, H, P, Stat, useLook } from '../src/components/ui.tsx';
import { allWords, trickyWords, isMastered, streak, norm, dateKey, daysUntil, parseDay, whenText, profileOf, plural, today, GAME_IDS } from '../src/logic/state.ts';
import { BANDS } from '../src/data/gradeLists.ts';
import { GAMES } from '../src/games/meta.ts';

function ReportInner() {
  const { root, kid } = useApp();
  const { c, f } = useLook();
  const me = profileOf(root), all = allWords(kid), tricky = trickyWords(kid);
  let A = 0, F = 0, mast = 0;
  for (const w of all) { const st = kid.stats[norm(w)]; if (st) { A += st.a; F += st.f; } if (isMastered(st)) mast++; }
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const vals = days.map(d => kid.hist[dateKey(d)] || { c: 0, m: 0 }), mx = Math.max(1, ...vals.map(v => v.c + v.m));
  const lists = kid.lists.slice().sort((a, b) => b.created - a.created);
  const day = kid.day.date === today() ? kid.day : { games: 0, ms: 0 };
  const played = GAME_IDS.filter(id => kid.best[id] != null);

  return (
    <Screen>
      <H>{me.avatar} {me.name}'s progress</H>
      <P small>Grade {BANDS[kid.set.grade]}</P>
      <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 0 }}>
        <Stat n={all.length} label="words this year" />
        <Stat n={mast} label="mastered" />
        <Stat n={tricky.length} label="tricky" />
        <Stat n={A ? Math.round(F / A * 100) + '%' : '–'} label="right on 1st try" />
        <Stat n={streak(kid)} label="day streak 🔥" />
        <Stat n={kid.stars} label="stars earned ⭐" />
        <Stat n={kid.spelled} label="words spelled" />
        <Stat n={kid.tokens} label="tokens 🪙" />
        <Stat n={kid.tickets} label="tickets 🎟️" />
        <Stat n={kid.tix.earned} label="tickets won in all" />
        <Stat n={kid.owned.length} label="prizes 🎁" />
      </Card>

      <Card>
        <H>Last 7 days</H>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 8 }} accessibilityLabel={days.map((d, i) => `${d.toLocaleDateString('en-US', { weekday: 'long' })}: ${vals[i].c} right, ${vals[i].m} missed`).join('. ')}>
          {days.map((d, i) => {
            const v = vals[i], tot = v.c + v.m, h = tot / mx * 100;
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <Text style={{ fontSize: 12 * f, color: c.soft }}>{tot || ''}</Text>
                <View style={{ width: '70%', height: `${Math.max(h, tot ? 4 : 0) * .78}%`, backgroundColor: c.bad, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' }}>
                  <View style={{ height: `${tot ? v.c / tot * 100 : 0}%`, backgroundColor: c.good }} />
                </View>
                <Text style={{ fontSize: 13 * f, color: c.ink, fontWeight: '700' }}>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</Text>
              </View>
            );
          })}
        </View>
        <P small>🟩 right on the first try · 🟥 missed first</P>
      </Card>

      <Card>
        <H>Word lists</H>
        {!lists.length && <P>No lists yet.</P>}
        {lists.map(l => {
          let a = 0, fr = 0, m = 0;
          for (const w of l.words) { const st = kid.stats[norm(w)]; if (st) { a += st.a; fr += st.f; } if (isMastered(st)) m++; }
          const pct = l.words.length ? Math.round(m / l.words.length * 100) : 0, dd = l.test ? daysUntil(l.test) : null;
          return (
            <View key={l.id} style={{ gap: 4 }}>
              <Text style={{ fontWeight: '800', color: c.ink, fontSize: 15 * f }}>{l.name}{l.test ? (dd != null && dd >= 0 ? `  📝 test ${whenText(dd, l.test)}` : `  (test was ${parseDay(l.test)!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`) : ''}</Text>
              <View style={{ height: 10, borderRadius: 5, backgroundColor: c.line, overflow: 'hidden' }}><View style={{ width: `${pct}%`, height: 10, backgroundColor: c.good }} /></View>
              <P small>{m} of {l.words.length} mastered · {a ? Math.round(fr / a * 100) + '% right on the first try' : 'not practiced yet'}</P>
            </View>
          );
        })}
      </Card>

      <Card>
        <H>🎯 Tricky words</H>
        {tricky.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{tricky.map(w =>
          <Text key={w} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: c.badBg, color: c.ink, fontWeight: '700', fontSize: 15 * f }}>{w}</Text>)}</View>
          : <P>None right now. 🎉</P>}
      </Card>

      <Card>
        <H>🎮 Games</H>
        <P>Today: {plural(day.games, 'game')}, {Math.round(day.ms / 60000)} min played.</P>
        {played.length ? played.map(id => <P key={id} small>{GAMES[id].em} {GAMES[id].title}: best {kid.best[id]}</P>) : <P small>No games played yet.</P>}
      </Card>
      <P small>"Mastered" means spelled right with no misses, or right on the first try twice in a row after a miss.</P>
    </Screen>
  );
}

export default function Report() {
  return <GrownUpOnly><ReportInner /></GrownUpOnly>;
}
