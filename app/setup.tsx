// First-time setup: name and picture, grade, first word list, PIN, voice check.
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../src/store/AppContext.tsx';
import { GrownUpOnly } from '../src/components/GrownUpOnly.tsx';
import { Screen, Card, H, P, Btn, Row, Field, Chips, useLook } from '../src/components/ui.tsx';
import { AVATARS, profileOf, uid } from '../src/logic/state.ts';
import { BANDS, GRADE_LISTS, gradeWords, type Band } from '../src/data/gradeLists.ts';
import { say } from '../src/speech.ts';
import { sfx } from '../src/sfx.ts';
import { SHOW_SUPPORT_LINK } from '../src/config.ts';

const N = 5;

function SetupInner() {
  const { root, kid, updateKid, updateRoot, choosePin, toast } = useApp();
  const { c, f } = useLook();
  const [step, setStep] = useState(0);
  const [goWords, setGoWords] = useState(false);
  const me = profileOf(root), band = kid.set.grade;
  const [name, setName] = useState(me.name === 'Speller' ? '' : me.name);
  const kidName = name.trim() || me.name;

  function saveName() { const n = name.trim(); if (n) updateRoot(r => { r.profiles.find(p => p.id === r.active)!.name = n.slice(0, 20); }); }
  function finish() {
    saveName();
    updateRoot(r => { r.setupDone = true; });
    if (router.canDismiss()) router.dismissAll(); else router.replace('/');
    if (goWords) { setTimeout(() => router.push('/words'), 60); toast('Type your words or tap Scan list 📷'); }
    else toast('All set! Happy spelling ⭐');
  }
  function next() { if (step === 0) saveName(); if (step >= N - 1) finish(); else setStep(step + 1); }
  function addFirstList() {
    const src = band + '-1';
    if (kid.lists.some(l => l.src === src)) return;
    updateKid(k => {
      const l = { id: uid(), name: `Gr ${BANDS[band]} Wk 1: ${GRADE_LISTS[band][0][0]}`.slice(0, 40), created: Date.now(), test: '', src, words: gradeWords(band, 0) };
      k.lists.push(l); k.cur = l.id;
    });
    sfx('coin', kid.set.sfx);
  }
  const choice = (on: boolean, title: string, sub: string, onPress: () => void) => (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: on }}
      style={{ borderWidth: 2, borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandSoft : '#fff', borderRadius: 14, padding: 14 }}>
      <Text style={{ fontSize: 17 * f, fontWeight: '800', color: c.ink }}>{title}</Text>
      <Text style={{ fontSize: 14 * f, color: c.soft, marginTop: 2 }}>{sub}</Text>
    </Pressable>
  );

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: N }, (_, i) => <View key={i} style={{ width: 26, height: 8, borderRadius: 4, backgroundColor: i <= step ? c.brand : c.line }} />)}
        </View>
        <Btn small kind="ghost" label="Skip setup" onPress={finish} />
      </Row>
      <Card>
        {step === 0 && <>
          <Image source={require('../assets/icon/logo.png')} accessibilityLabel="Spelling Arcade" style={{ width: 96, height: 96, borderRadius: 22, alignSelf: 'center' }} />
          <H style={{ textAlign: 'center' }}>Welcome to Spelling Arcade!</H>
          <P style={{ textAlign: 'center' }}>Let's get set up. It takes about a minute.</P>
          <Text style={{ fontSize: 16 * f, fontWeight: '700', color: c.ink }}>Who's the speller?</Text>
          <Field value={name} onChangeText={setName} maxLength={20} placeholder="Their first name" accessibilityLabel="Speller's first name" />
          <Text style={{ fontSize: 16 * f, fontWeight: '700', color: c.ink }}>Pick a picture</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {AVATARS.map(a => (
              <Pressable key={a} onPress={() => updateRoot(r => { r.profiles.find(p => p.id === r.active)!.avatar = a; })} accessibilityLabel={`Picture ${a}`} accessibilityState={{ selected: a === me.avatar }}
                style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: a === me.avatar ? c.brand : c.brandSoft }}>
                <Text style={{ fontSize: 30 }}>{a}</Text>
              </Pressable>
            ))}
          </View>
          <P small>You can add more kids later in Settings.</P>
        </>}
        {step === 1 && <>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>🎒</Text>
          <H>What grade is {kidName} in?</H>
          <P>This sets the word lists and how {kidName} spells.</P>
          {([['k1', 'K–1', 'Letter tiles, short words like cat and sun'], ['23', '2–3', 'Keyboard, words like friend and night'], ['46', '4–6', 'Keyboard, words like separate and science, plus meanings']] as [Band, string, string][])
            .map(([v, l, d]) => <View key={v}>{choice(band === v, `Grades ${l}`, d, () => updateKid(k => { k.set.grade = v; }))}</View>)}
        </>}
        {step === 2 && <>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>📚</Text>
          <H>Add a first word list</H>
          <P>Start with a ready-made list, or use your school's list.</P>
          {(() => { const added = kid.lists.some(l => l.src === band + '-1'); return choice(added, `${added ? '✓ Added: ' : ''}Grades ${BANDS[band]} · Week 1`, `${GRADE_LISTS[band][0][0]}: ${gradeWords(band, 0).join(', ')}`, addFirstList); })()}
          {choice(goWords, `${goWords ? '✓ ' : ''}I'll type or scan our school list`, "You'll go to My Words when setup is done", () => setGoWords(g => !g))}
        </>}
        {step === 3 && <>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>🔒</Text>
          <H>Grown-up PIN</H>
          <P>A 4-digit PIN keeps kids out of word lists, settings, tokens and family prizes.</P>
          {root.pin ? <Text style={{ color: c.good, fontWeight: '800', fontSize: 17 * f }}>✓ PIN is set</Text> : <Btn label="Set a PIN" onPress={() => choosePin()} />}
          <P small>You can skip this and set it later in Settings.</P>
        </>}
        {step === 4 && <>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>🔊</Text>
          <H>Check the voice</H>
          <P>Turn the volume up, then play a word.</P>
          <Btn kind="sky" label="🔊 Play a word" onPress={() => say('cat', kid.set)} />
          <Chips label="Voice" value={kid.set.voiceGender} onChange={v => { updateKid(k => { k.set.voiceGender = v; k.set.voiceName = ''; }); setTimeout(() => say('cat', { ...kid.set, voiceGender: v, voiceName: '' }), 50); }}
            options={[{ v: 'any', label: 'Any' }, { v: 'female', label: '👩 Female' }, { v: 'male', label: '👨 Male' }]} />
          <P small>No sound? Check the volume and silent mode. The Help page has a Sound check.</P>
          <Card style={{ gap: 4, marginTop: 4 }}>
            <Text style={{ fontWeight: '800', fontSize: 15 * f, color: c.ink }}>How it works</Text>
            <P small>✏️ Spell words → 🪙 earn tokens → 🎮 play games → 🎟️ win tickets → 🎁 trade them at the Prize Counter.</P>
            <P small>Want real-world rewards too? Add family prizes in Settings › Tickets & prizes.</P>
          </Card>
          {SHOW_SUPPORT_LINK && <P small style={{ marginTop: 6 }}>🕹️ Spelling Arcade is free with no ads. If you enjoy it, there's a way to support it in Settings › About & support.</P>}
        </>}
        <Row style={{ marginTop: 6 }}>
          {step > 0 && <Btn kind="ghost" label="← Back" onPress={() => setStep(step - 1)} />}
          <Btn kind="good" label={step === N - 1 ? 'Finish 🎉' : step === 3 && !root.pin ? 'Skip for now →' : 'Next →'} onPress={next} style={{ flex: 1 }} />
        </Row>
      </Card>
    </Screen>
  );
}

// First-time setup is open to anyone; running it again later is a grown-up action.
export default function Setup() {
  const { root } = useApp();
  return root.setupDone ? <GrownUpOnly><SetupInner /></GrownUpOnly> : <SetupInner />;
}
