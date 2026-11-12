import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useApp } from '../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, IconBtn, useLook } from '../src/components/ui.tsx';
import { KidHelp } from '../src/components/overlays.tsx';
import { GAME_IDS, limitReason, plural, today, type GameId } from '../src/logic/state.ts';
import { GAMES } from '../src/games/meta.ts';
import { sfx } from '../src/sfx.ts';

export default function Arcade() {
  const { kid, updateKid, toast } = useApp();
  const { c, f } = useLook();
  const [help, setHelp] = useState(false);
  const s = kid.set, cost = s.cost, lim = limitReason(kid), can = kid.tokens >= cost && !lim;
  const day = kid.day.date === today() ? kid.day : { games: 0, ms: 0 };
  const ids = GAME_IDS.filter(id => !s.off.includes(id));
  const favs = ids.filter(id => kid.favs.includes(id)), rest = ids.filter(id => !kid.favs.includes(id));

  function toggleFav(id: GameId) {
    const on = kid.favs.includes(id);
    updateKid(k => { k.favs = on ? k.favs.filter(x => x !== id) : [...k.favs, id]; });
    if (on) toast('Removed from favorites'); else { toast(`${GAMES[id].em} Added to favorites ⭐`); sfx('star', s.sfx); }
  }
  function play(id: GameId) {
    if (lim) { toast(lim); return; }
    if (kid.tokens < cost) { toast('Spell words to earn tokens! ✏️'); return; }
    router.push({ pathname: '/game', params: { id } });
  }
  const extra: string[] = [];
  if (s.maxGames) extra.push(`${Math.max(0, s.maxGames - day.games)} of ${s.maxGames} games left today`);
  if (s.maxMin) extra.push(`${Math.max(0, Math.ceil(s.maxMin - day.ms / 60000))} min of play left`);

  const card = (id: GameId) => {
    const g = GAMES[id], best = kid.best[id], on = kid.favs.includes(id);
    return (
      <Card key={id} style={{ width: '48%', flexGrow: 1, alignItems: 'center', gap: 6, paddingTop: 12 }}>
        <Pressable onPress={() => toggleFav(id)} hitSlop={10} style={{ position: 'absolute', top: 6, right: 8 }}
          accessibilityRole="button" accessibilityLabel={`${on ? 'Remove from' : 'Add to'} favorites`} accessibilityState={{ selected: on }}>
          <Text style={{ fontSize: 24, color: on ? c.sun : '#a1a1aa' }}>{on ? '★' : '☆'}</Text>
        </Pressable>
        <Text style={{ fontSize: 40 }}>{g.em}</Text>
        <Text style={{ fontSize: 16 * f, fontWeight: '900', color: c.ink, textAlign: 'center' }}>{g.title}</Text>
        <P small style={{ textAlign: 'center' }}>{g.desc}</P>
        <Text style={{ color: c.soft, fontSize: 13 * f }}>{best != null ? `🏆 Best: ${best}` : ' '}</Text>
        <Btn small kind={can ? 'good' : 'secondary'} style={{ alignSelf: 'stretch' }}
          label={lim ? 'Done for today' : kid.tokens >= cost ? `Play · ${cost} 🪙` : `Need ${cost} 🪙`} onPress={() => play(id)} />
      </Card>
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerRight: () => <IconBtn icon="❓" label="How the Arcade works" onPress={() => setHelp(true)} /> }} />
      <Card>
        {lim ? <>
          <H>{lim}</H>
          <P>You can still practice spelling to earn tokens for tomorrow.</P>
        </> : kid.tokens >= cost
          ? <P style={{ color: c.ink }}>You have <Text style={{ fontWeight: '900' }}>{kid.tokens} 🪙</Text>. Each game costs {plural(cost, 'token')}.</P>
          : <>
            <P style={{ color: c.ink }}>You need {plural(cost, 'token')} to play! Spell words to earn them.</P>
            <Btn label="✏️ Earn tokens" onPress={() => router.replace('/practice')} />
          </>}
        {!lim && extra.length > 0 && <P small>{extra.join(' · ')}</P>}
      </Card>
      {!ids.length && <P>No games are turned on. A grown-up can turn them on in Settings.</P>}
      {favs.length > 0 && <H>⭐ My favorites</H>}
      {favs.length > 0 && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{favs.map(card)}</View>}
      {favs.length > 0 && rest.length > 0 && <H>🎮 All games</H>}
      {!favs.length && ids.length > 0 && <P small>Tap ☆ on a game to make it a favorite. Favorites show up first.</P>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{rest.map(card)}</View>
      <KidHelp visible={help} onClose={() => setHelp(false)} title="How the Arcade works" steps={[
        ['🪙', `Each game costs ${plural(cost, 'token')}.`],
        ['☆', 'Tap the star on a game to make it a favorite. Favorites go to the top.'],
        ['▶️', 'Tap Play. The game shows you how to play before it starts.'],
        ['✏️', 'Need more tokens? Practice spelling to earn them!'],
      ]} />
    </Screen>
  );
}
