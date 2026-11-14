// Grown-ups: make real-world prizes kids can trade tickets for, and answer kids' requests.
// Behind the PIN like every grown-up screen.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useApp } from '../src/store/AppContext.tsx';
import { GrownUpOnly } from '../src/components/GrownUpOnly.tsx';
import { Screen, Card, Btn, H, P, Row, Field, Chips, Sheet, Toggle, useLook } from '../src/components/ui.tsx';
import { FAMILY_EMOJI } from '../src/data/prizes.ts';
import { normFamPrize, uid, type FamPrize } from '../src/logic/state.ts';
import { answerReq, ticketsPerDay, waitingReqs } from '../src/logic/prizes.ts';
import { ReqRow, when, TICKET } from '../src/components/tickets.tsx';
import { sfx } from '../src/sfx.ts';

const FREQ: { v: FamPrize['freq']; label: string; text: string }[] = [
  { v: 'any', label: 'Any time', text: 'any time' },
  { v: 'week', label: 'Once a week', text: 'once a week' },
  { v: 'month', label: 'Once a month', text: 'once a month' },
  { v: 'once', label: 'Just once', text: 'just once' },
];
const blank = (): FamPrize => ({ id: '', name: '', em: '🎁', price: 100, freq: 'week', kids: [] });

function FamilyPrizesInner() {
  const { root, updateRoot, toast, kid } = useApp();
  const { c, f } = useLook();
  const [edit, setEdit] = useState<FamPrize | null>(null);
  const nameOf = (id: string) => root.profiles.find(p => p.id === id)?.name || 'Kid';
  const waiting = waitingReqs(root);
  const history = root.profiles.flatMap(p => (root.P[p.id]?.famReq || []).filter(q => q.st !== 'wait').map(q => ({ kidId: p.id, q })))
    .sort((a, b) => b.q.done - a.q.done).slice(0, 10);

  function answer(kidId: string, reqId: string, ok: boolean) {
    updateRoot(r => { const k = r.P[kidId]; if (k) answerReq(k, reqId, ok); });
    if (ok) sfx('win', kid.set.sfx);
    toast(ok ? `OK'd! Enjoy it, ${nameOf(kidId)}! 🎉` : `Tickets returned to ${nameOf(kidId)}.`);
  }
  function save() {
    if (!edit) return;
    const p = normFamPrize({ ...edit, id: edit.id || uid() });
    if (!p) { toast('Give the prize a name'); return; }
    updateRoot(r => { const i = r.fam.prizes.findIndex(x => x.id === p.id); if (i >= 0) r.fam.prizes[i] = p; else r.fam.prizes.push(p); });
    setEdit(null); toast(edit.id ? 'Prize saved' : `Added: ${p.em} ${p.name}`);
  }
  function remove() {
    if (!edit?.id) return;
    const id = edit.id;
    updateRoot(r => { r.fam.prizes = r.fam.prizes.filter(x => x.id !== id); for (const p of r.profiles) { const k = r.P[p.id]; if (k?.goal === 'fam:' + id) k.goal = ''; } });
    setEdit(null); toast('Prize removed. Requests already sent can still be answered.');
  }

  // Price hint: how many days of playing the price is, for each kid who can pick it.
  const hintKids = edit ? (edit.kids.length ? edit.kids : root.profiles.map(p => p.id)) : [];
  const hints = edit ? hintKids.map(id => ({ name: nameOf(id), per: ticketsPerDay(root.P[id]) })).filter(h => h.per > 0) : [];

  return (
    <Screen>
      <Card style={waiting.length ? { backgroundColor: '#fff7ed', borderColor: '#fdba74', borderWidth: 2 } : undefined}>
        <H>Waiting for you{waiting.length ? ` (${waiting.length})` : ''}</H>
        {!waiting.length && <P small>When a kid picks a family prize, it shows up here for you to OK.</P>}
        {waiting.map(({ kidId, q }) => (
          <View key={q.id} style={{ gap: 8 }}>
            <Row style={{ flexWrap: 'nowrap' }}>
              <Text style={{ fontSize: 34 }}>{q.em}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', fontSize: 16 * f, color: c.ink }}>{nameOf(kidId)} wants: {q.name}</Text>
                <P small>{q.price} tickets · asked {when(q.at)}</P>
              </View>
            </Row>
            <Row style={{ flexWrap: 'nowrap' }}>
              <Btn kind="good" label="OK it" onPress={() => answer(kidId, q.id, true)} style={{ flex: 1 }} />
              <Btn kind="ghost" label="Not now" onPress={() => answer(kidId, q.id, false)} style={{ flex: 1 }} />
            </Row>
          </View>
        ))}
        {waiting.length > 0 && <P small>"Not now" gives the tickets back.</P>}
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H>Your prizes</H>
          <Btn small label="+ Add prize" onPress={() => setEdit(blank())} disabled={root.fam.prizes.length >= 30} />
        </Row>
        {!root.fam.prizes.length && <P small>Add real-world rewards like "Pick dinner" or "30 minutes at the park." Kids trade tickets for them, and you OK each one.</P>}
        {root.fam.prizes.map(p => (
          <Pressable key={p.id} onPress={() => setEdit({ ...p, kids: [...p.kids] })} accessibilityRole="button" accessibilityLabel={`Edit ${p.name}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <Text style={{ fontSize: 26 }}>{p.em}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 15 * f, color: c.ink }}>{p.name}</Text>
              <P small>{p.price} tickets · {FREQ.find(x => x.v === p.freq)!.text} · {p.kids.length ? p.kids.map(nameOf).join(', ') : 'all kids'}</P>
            </View>
            <Text style={{ fontWeight: '800', color: c.brandDark, fontSize: 14 * f }}>Edit</Text>
          </Pressable>
        ))}
        <Toggle label="Show family prizes" help="Adds the Family shelf to the Prize Counter" value={root.fam.on} onChange={v => updateRoot(r => { r.fam.on = v; })} />
      </Card>

      {history.length > 0 && (
        <Card>
          <H>History</H>
          {history.map(({ kidId, q }) => <ReqRow key={q.id} q={q} who={nameOf(kidId)} />)}
        </Card>
      )}

      <Sheet visible={!!edit} onClose={() => setEdit(null)}>
        {edit && <>
          <H>{edit.id ? 'Edit prize' : 'Add a prize'}</H>
          <Text style={{ fontWeight: '700', fontSize: 16 * f, color: c.ink }}>Prize name</Text>
          <Field value={edit.name} onChangeText={t => setEdit({ ...edit, name: t.slice(0, 30) })} placeholder="Pick dinner" accessibilityLabel="Prize name" maxLength={30} />
          <Text style={{ fontWeight: '700', fontSize: 16 * f, color: c.ink }}>Picture</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {FAMILY_EMOJI.map(e => (
              <Pressable key={e} onPress={() => setEdit({ ...edit, em: e })} accessibilityRole="radio" accessibilityState={{ selected: edit.em === e }} accessibilityLabel={`Picture ${e}`}
                style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: edit.em === e ? 3 : 2, borderColor: edit.em === e ? c.brand : c.line, backgroundColor: edit.em === e ? c.brandSoft : '#fff' }}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ fontWeight: '700', fontSize: 16 * f, color: c.ink }}>Ticket price</Text>
          <Row style={{ justifyContent: 'center', gap: 16 }}>
            <Btn kind="secondary" label="−" onPress={() => setEdit({ ...edit, price: Math.max(5, edit.price - (edit.price > 100 ? 25 : 10)) })} style={{ width: 52 }} />
            <Text style={{ fontSize: 34 * f, fontWeight: '900', color: TICKET.strong, minWidth: 90, textAlign: 'center' }}>{edit.price}</Text>
            <Btn kind="secondary" label="+" onPress={() => setEdit({ ...edit, price: Math.min(5000, edit.price + (edit.price >= 100 ? 25 : 10)) })} style={{ width: 52 }} />
          </Row>
          <Row style={{ justifyContent: 'center' }}>{[50, 100, 150, 250, 400].map(n => <Btn key={n} small kind={edit.price === n ? 'primary' : 'ghost'} label={String(n)} onPress={() => setEdit({ ...edit, price: n })} />)}</Row>
          <P small>{hints.length
            ? hints.map(h => `About ${Math.max(1, Math.round(edit.price / h.per))} day${Math.round(edit.price / h.per) > 1 ? 's' : ''} of playing for ${h.name} (about ${h.per} tickets a day)`).join('. ') + '.'
            : 'A kid wins about 1 to 10 tickets per game, more for great scores.'}</P>
          <Chips label="How often can it be picked?" value={edit.freq} onChange={v => setEdit({ ...edit, freq: v })} options={FREQ.map(x => ({ v: x.v, label: x.label }))} />
          {root.profiles.length > 1 && <>
            <Text style={{ fontWeight: '700', fontSize: 16 * f, color: c.ink }}>Who can pick it?</Text>
            <Row>
              <Btn small kind={!edit.kids.length ? 'primary' : 'ghost'} label="All kids" onPress={() => setEdit({ ...edit, kids: [] })} />
              {root.profiles.map(p => {
                const on = edit.kids.includes(p.id);
                return <Btn key={p.id} small kind={on ? 'primary' : 'ghost'} label={`${p.avatar} ${p.name}`}
                  onPress={() => setEdit({ ...edit, kids: on ? edit.kids.filter(x => x !== p.id) : [...edit.kids, p.id] })} />;
              })}
            </Row>
          </>}
          <Btn label="Save prize" onPress={save} disabled={!edit.name.trim()} />
          {!!edit.id && <Btn kind="danger" label="Remove prize" onPress={remove} />}
          <Btn kind="ghost" label="Cancel" onPress={() => setEdit(null)} />
        </>}
      </Sheet>
    </Screen>
  );
}

export default function FamilyPrizes() {
  return <GrownUpOnly><FamilyPrizesInner /></GrownUpOnly>;
}
