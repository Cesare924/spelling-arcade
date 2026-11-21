// A kid's collection: trophy shelf, sticker book, game looks to switch on, and avatars.
import { Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Row, useLook, Em } from '../src/components/ui.tsx';
import { PRIZES } from '../src/data/prizes.ts';
import { setLook } from '../src/logic/prizes.ts';
import { profileOf } from '../src/logic/state.ts';
import { TicketBadge } from '../src/components/tickets.tsx';

export default function MyPrizes() {
  const { root, kid, updateKid, updateRoot, toast } = useApp();
  const { c, f } = useLook();
  const me = profileOf(root);
  const own = (id: string) => kid.owned.includes(id);
  const stickers = PRIZES.filter(p => p.kind === 'sticker'), got = stickers.filter(p => own(p.id)).length;
  const trophies = PRIZES.filter(p => p.kind === 'trophy');
  const looks = PRIZES.filter(p => p.kind === 'look' && own(p.id));
  const avatars = PRIZES.filter(p => p.kind === 'avatar' && own(p.id));
  const nothing = !kid.owned.length;

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <TicketBadge n={kid.tickets} />
        <Btn small kind="secondary" label="Prize Counter" onPress={() => router.canGoBack() ? router.back() : router.replace('/prizes')} />
      </Row>
      {nothing && <Card><P>No prizes yet! Win tickets in the Arcade, then trade them at the Prize Counter.</P></Card>}

      <Card>
        <Row style={{ justifyContent: 'space-between' }}><H>🏆 Trophy shelf</H><P small>Shows on your home screen</P></Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: 8, paddingTop: 6, borderBottomWidth: 10, borderBottomColor: '#d6a46c', borderRadius: 4 }}>
          {trophies.map(p => (
            <View key={p.id} style={{ alignItems: 'center', width: '19%' }} accessible accessibilityLabel={own(p.id) ? p.name : `${p.name}, not won yet, ${p.price} tickets`}>
              {own(p.id) ? <Em em={p.em} size={40} />
                : <View style={{ width: 40, height: 40, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#94a3b8', marginVertical: 6 }} />}
              <Text style={{ fontSize: 11 * f, color: own(p.id) ? c.ink : '#475569', fontWeight: '700', textAlign: 'center' }}>{own(p.id) ? p.name : p.price}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
        <Row style={{ justifyContent: 'space-between' }}><H>📒 Sticker book</H><Text style={{ fontWeight: '900', color: '#92400e', fontSize: 15 * f }}>{got} of {stickers.length}</Text></Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {stickers.map((p, i) => (
            <View key={p.id} accessible accessibilityLabel={own(p.id) ? p.name : 'Empty sticker spot'}
              style={{ width: '17.5%', aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                ...(own(p.id) ? { backgroundColor: '#fff', transform: [{ rotate: `${[-6, 4, -3, 7, -5][i % 5]}deg` }], borderBottomWidth: 2, borderBottomColor: '#fcd34d' }
                  : { borderWidth: 2, borderStyle: 'dashed', borderColor: '#fcd34d' }) }}>
              {own(p.id) ? <Em em={p.em} size={28} /> : <Text style={{ fontSize: 20, color: '#b45309', fontWeight: '900' }}>?</Text>}
            </View>
          ))}
        </View>
        <P small style={{ color: '#78350f' }}>{got === stickers.length ? '🌟 Sticker Star! You collected every sticker!' : 'Fill the whole page to become a Sticker Star!'}</P>
      </Card>

      <Card>
        <H>🎨 Game looks</H>
        {!looks.length && <P small>Buy game looks at the Prize Counter to change how your games look.</P>}
        {looks.map(p => {
          const on = kid.looksOn.includes(p.id);
          return (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 14, backgroundColor: c.bg }}>
              <Text style={{ fontSize: 30 }}>{p.em}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', fontSize: 15 * f, color: c.ink }}>{p.name}</Text>
                <Text style={{ fontSize: 12.5 * f, color: c.soft }}>{p.where}</Text>
              </View>
              <Switch value={on} onValueChange={v => updateKid(k => setLook(k, p.id, v))} accessibilityLabel={`${p.name} in ${p.where}`}
                trackColor={{ true: c.good, false: '#d1d5db' }} />
            </View>
          );
        })}
      </Card>

      <Card>
        <H>🙂 Avatars</H>
        {!avatars.length && <P small>Win new avatars at the Prize Counter.</P>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {avatars.map(p => {
            const on = me.avatar === p.em;
            return (
              <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Use ${p.name} as my picture`} accessibilityState={{ selected: on }}
                onPress={() => { updateRoot(r => { const pr = r.profiles.find(x => x.id === r.active); if (pr) pr.avatar = p.em; }); toast(`New picture: ${p.em}`); }}
                style={{ width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.brandSoft : c.bg, borderWidth: on ? 3 : 2, borderColor: on ? c.brand : c.line }}>
                <Text style={{ fontSize: 30 }}>{p.em}</Text>
              </Pressable>
            );
          })}
        </View>
        {avatars.length > 0 && <P small>Tap one to use it as your picture.</P>}
      </Card>
    </Screen>
  );
}
