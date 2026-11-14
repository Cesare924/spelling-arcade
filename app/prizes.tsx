// The Prize Counter: trade tickets won in games for stickers, avatars, game looks,
// top-shelf prizes, and real-world family prizes that a grown-up OKs.
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useApp } from '../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Row, Sheet, IconBtn, useLook } from '../src/components/ui.tsx';
import { KidHelp } from '../src/components/overlays.tsx';
import { PRIZES, SHELVES, KIND_NOTE, type PrizeKind } from '../src/data/prizes.ts';
import { buyPrize, famBlock, famFor, goalOf, requestFam, setAside } from '../src/logic/prizes.ts';
import { sfx } from '../src/sfx.ts';
import { TicketBadge, TICKET, GoalBar, ReqRow } from '../src/components/tickets.tsx';

type Shelf = PrizeKind | 'family';
interface Item { key: string; em: string; name: string; price: number; desc: string; fam?: string; owned: boolean; block: string }

export default function PrizeCounter() {
  const { root, kid, updateKid, toast, requirePin } = useApp();
  const { c, f } = useLook();
  const [shelf, setShelf] = useState<Shelf>('sticker');
  const [sel, setSel] = useState<Item | null>(null);
  const [help, setHelp] = useState(false);
  const kidId = root.active, fams = famFor(root, kidId);
  const shelves = SHELVES.filter(s => s.kind !== 'family' || root.fam.on);
  const goal = goalOf(root, kid, kidId), held = setAside(kid);

  const items: Item[] = shelf === 'family'
    ? fams.map(p => ({ key: 'fam:' + p.id, fam: p.id, em: p.em, name: p.name, price: p.price, owned: false, block: famBlock(kid, p),
        desc: 'A grown-up will OK this. Your tickets are set aside until they answer.' }))
    : PRIZES.filter(p => p.kind === shelf).map(p => ({ key: p.id, em: p.em, name: p.name, price: p.price, owned: kid.owned.includes(p.id),
        block: '', desc: p.where ? `${KIND_NOTE[p.kind]} Works in ${p.where}.` : KIND_NOTE[p.kind] }));

  function trade(it: Item) {
    if (it.fam) {
      const p = fams.find(x => x.id === it.fam); if (!p) return;
      let err = ''; updateKid(k => { err = requestFam(k, p); });
      if (err) { toast(err); return; }
      sfx('star', kid.set.sfx); setSel(null);
      toast(`Sent! Show a grown-up so they can OK “${p.name}”.`);
      return;
    }
    let err = ''; updateKid(k => { err = buyPrize(k, it.key); });
    if (err) { toast(err); return; }
    sfx('win', kid.set.sfx); setSel(null);
    toast(`You got the ${it.name}! ${it.em} Find it in My Prizes.`);
  }
  function saveFor(it: Item) {
    updateKid(k => { k.goal = k.goal === it.key ? '' : it.key; });
    setSel(null);
    toast(kid.goal === it.key ? 'Goal cleared' : `Saving for: ${it.name} ${it.em}`);
  }

  const blurb = SHELVES.find(s => s.kind === shelf)?.blurb || '';
  const s = sel, can = !!s && !s.owned && kid.tickets >= s.price && (!s.fam || !s.block);
  return (
    <Screen>
      <Stack.Screen options={{ headerRight: () => <IconBtn icon="❓" label="How the Prize Counter works" onPress={() => setHelp(true)} /> }} />
      <Card style={{ backgroundColor: TICKET.soft, borderColor: TICKET.line, gap: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <TicketBadge n={kid.tickets} big />
          <Btn small kind="secondary" label="🎁 My Prizes" onPress={() => router.push('/my-prizes')} />
        </Row>
        {held > 0 && <P small>{held} more tickets are set aside, waiting for a grown-up.</P>}
        {goal ? <GoalBar goal={goal} have={kid.tickets} /> : <P small>Tip: tap a prize and choose "Save for this" to set a goal.</P>}
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {shelves.map(sh => {
          const on = sh.kind === shelf;
          return (
            <Pressable key={sh.kind} onPress={() => setShelf(sh.kind)} accessibilityRole="tab" accessibilityState={{ selected: on }}
              style={{ paddingVertical: 9 * f, paddingHorizontal: 16, borderRadius: 999, backgroundColor: on ? c.ink : '#fff', borderWidth: 2, borderColor: on ? c.ink : c.line }}>
              <Text style={{ fontSize: 15 * f, fontWeight: '800', color: on ? '#fff' : c.soft }}>{sh.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <P small>{blurb}</P>

      {shelf === 'family' && !items.length && (
        <Card><P>No family prizes yet. A grown-up can add some in Settings › Family prizes.</P></Card>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {items.map(it => {
          const afford = kid.tickets >= it.price;
          const tag = it.owned ? 'Owned ✓' : it.fam && it.block && afford ? 'Not now' : afford ? `${it.price} 🎟️` : `Need ${it.price - kid.tickets}`;
          const tagBg = it.owned ? c.goodBg : afford && !(it.fam && it.block) ? '#ffe4e6' : '#f1f5f9';
          const tagFg = it.owned ? '#166534' : afford && !(it.fam && it.block) ? TICKET.ink : '#475569';
          return (
            <Pressable key={it.key} onPress={() => setSel(it)} accessibilityRole="button"
              accessibilityLabel={`${it.name}, ${it.owned ? 'owned' : it.price + ' tickets'}`}
              style={({ pressed }) => ({ width: '31.5%', flexGrow: 1, maxWidth: '33%', alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 16,
                backgroundColor: afford || it.owned ? '#fff7ed' : '#f8fafc', borderWidth: 2, borderColor: afford || it.owned ? '#fed7aa' : '#e2e8f0', opacity: pressed ? .8 : 1 })}>
              <Text style={{ fontSize: 38 }}>{it.em}</Text>
              <Text numberOfLines={2} style={{ fontSize: 12.5 * f, fontWeight: '800', color: c.ink, textAlign: 'center', minHeight: 32 * f }}>{it.name}</Text>
              <Text style={{ fontSize: 12 * f, fontWeight: '800', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: tagBg, color: tagFg }}>{tag}</Text>
              {kid.goal === it.key && <Text style={{ fontSize: 11 * f, color: TICKET.ink, fontWeight: '800' }}>🎯 My goal</Text>}
            </Pressable>
          );
        })}
      </View>

      {shelf === 'family' && kid.famReq.length > 0 && (
        <Card>
          <H>My family prizes</H>
          {[...kid.famReq].reverse().slice(0, 8).map(q => <ReqRow key={q.id} q={q} />)}
          {held > 0 && <Btn label="🔒 Grown-up: answer now" onPress={() => requirePin(() => router.push('/family-prizes'))} />}
        </Card>
      )}

      <Sheet visible={!!s} onClose={() => setSel(null)}>
        {s && <>
          <Text style={{ fontSize: 72, textAlign: 'center' }}>{s.em}</Text>
          <H style={{ textAlign: 'center' }}>{s.name}</H>
          <P style={{ textAlign: 'center' }}>{s.desc}</P>
          <View style={{ alignItems: 'center' }}><TicketBadge n={s.price} label="tickets" /></View>
          <P small style={{ textAlign: 'center' }}>
            {s.owned ? 'You already have this one.'
              : s.fam && s.block ? s.block
              : kid.tickets >= s.price ? `You have ${kid.tickets} tickets.`
              : `Win ${s.price - kid.tickets} more tickets in the Arcade to get this.`}
          </P>
          {can && <Btn big label={s.fam ? 'Ask a grown-up' : 'Trade tickets'} onPress={() => trade(s)} style={{ backgroundColor: TICKET.main }} />}
          {!s.owned && !can && <Btn kind="secondary" label={kid.goal === s.key ? '🎯 Stop saving for this' : '🎯 Save for this'} onPress={() => saveFor(s)} />}
          <Btn kind="ghost" label={can ? 'Not now' : 'OK'} onPress={() => setSel(null)} />
        </>}
      </Sheet>

      <KidHelp visible={help} onClose={() => setHelp(false)} title="How the Prize Counter works" steps={[
        ['🎮', 'Play games in the Arcade to win tickets. Better scores win more!'],
        ['🎟️', 'Trade your tickets here for stickers, avatars, game looks and big prizes.'],
        ['🎯', 'Tap a prize and choose "Save for this" to set a goal.'],
        ['👨‍👩‍👧', 'Family prizes are real prizes. A grown-up has to OK them.'],
      ]} />
    </Screen>
  );
}
