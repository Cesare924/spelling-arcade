import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Row, Chips, Field, Sheet, useLook } from '../src/components/ui.tsx';
import { curList, norm, parseDay, dateKey, weekName, uid, plural, isMastered } from '../src/logic/state.ts';
import { addWords, splitWords, cleanWord, builtinSent } from '../src/logic/practice.ts';
import { BANDS, GRADE_LISTS, STARTERS, gradeWords, type Band } from '../src/data/gradeLists.ts';
import { say } from '../src/speech.ts';
import { sfx } from '../src/sfx.ts';

function nextWeekday(day: number, extraWeeks = 0) { // 5 = Friday
  const d = new Date(); const add = ((day - d.getDay() + 7) % 7) || 7; d.setDate(d.getDate() + add + extraWeeks * 7); return dateKey(d);
}

export default function Words() {
  const { kid, root, updateKid, updateRoot, toast } = useApp();
  const { c, f } = useLook();
  const [text, setText] = useState('');
  const [band, setBand] = useState<Band>(kid.set.grade);
  const [week, setWeek] = useState(0);
  const [wordSheet, setWordSheet] = useState<string | null>(null);
  const [sentDraft, setSentDraft] = useState('');
  const L = curList(kid);

  function add() {
    const raw = splitWords(text); if (!raw.length) return;
    const bad = raw.filter(w => !cleanWord(w));
    let n = 0; updateKid(k => { n = addWords(k, raw, weekName()); });
    setText('');
    toast(n ? `Added ${plural(n, 'word')} ✅` + (bad.length ? ` (skipped ${bad.length})` : '') : 'Those words are already on the list.');
  }
  function newList() {
    updateKid(k => { const l = { id: uid(), name: weekName(), created: Date.now(), test: '', src: '', words: [] }; k.lists.push(l); k.cur = l.id; });
    toast('New list started. Add this week\'s words ✏️');
  }
  function addGrade() {
    const src = `${band}-${week + 1}`;
    if (kid.lists.some(l => l.src === src)) { toast('That list is already added'); return; }
    updateKid(k => {
      const l = { id: uid(), name: `Gr ${BANDS[band]} Wk ${week + 1}: ${GRADE_LISTS[band][week][0]}`.slice(0, 40), created: Date.now(), test: '', src, words: gradeWords(band, week) };
      k.lists.push(l); k.cur = l.id;
    });
    sfx('coin', kid.set.sfx); toast('List added 📚');
  }
  function starter(level: string) {
    updateKid(k => {
      const l = { id: uid(), name: `Starter: ${level}`, created: Date.now(), test: '', src: 'st-' + level, words: STARTERS[level].slice() };
      k.lists.push(l); k.cur = l.id;
    });
  }
  function removeWord(w: string) {
    updateKid(k => { const l = k.lists.find(x => x.id === k.cur); if (l) l.words = l.words.filter(x => norm(x) !== norm(w)); });
    setWordSheet(null);
  }
  function saveSentence(w: string) {
    const s = sentDraft.trim();
    if (s && !new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(s)) { toast(`The sentence needs to use the word "${w}"`); return; }
    updateRoot(r => { if (s) r.sent[norm(w)] = s.slice(0, 200); else delete r.sent[norm(w)]; });
    toast(s ? 'Sentence saved 💬' : 'Sentence removed'); setWordSheet(null);
  }
  function deleteList() {
    if (!L) return;
    Alert.alert('Delete this list?', `"${L.name}" will be removed. Progress on its words is kept.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => updateKid(k => {
        k.lists = k.lists.filter(l => l.id !== L.id);
        k.cur = k.lists.length ? k.lists[k.lists.length - 1].id : null;
      }) },
    ]);
  }
  const setTest = (v: string) => updateKid(k => { const l = k.lists.find(x => x.id === k.cur); if (l) l.test = parseDay(v) ? v : ''; });
  const rename = (v: string) => updateKid(k => { const l = k.lists.find(x => x.id === k.cur); if (l) l.name = (v.trim() || l.name).slice(0, 40); });

  const preview = gradeWords(band, week), added = kid.lists.some(l => l.src === `${band}-${week + 1}`);
  const fri = nextWeekday(5), fri2 = nextWeekday(5, 1);

  return (
    <Screen>
      <P small>{plural(kid.lists.length, 'list')} this year · words for {root.profiles.find(p => p.id === root.active)?.name}</P>
      {kid.lists.length > 1 && (
        <Card>
          <H>📂 Lists</H>
          <View style={{ gap: 8 }}>
            {kid.lists.slice().reverse().map(l => (
              <Pressable key={l.id} onPress={() => updateKid(k => { k.cur = l.id; })} accessibilityRole="button" accessibilityState={{ selected: l.id === kid.cur }}
                style={{ borderWidth: 2, borderColor: l.id === kid.cur ? c.brand : c.line, backgroundColor: l.id === kid.cur ? c.brandSoft : '#fff', borderRadius: 12, padding: 10 }}>
                <Text style={{ fontSize: 16 * f, fontWeight: '800', color: c.ink }}>{l.name}</Text>
                <Text style={{ color: c.soft, fontSize: 13 * f }}>{plural(l.words.length, 'word')}{l.test ? ` · test ${l.test}` : ''}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      )}
      <Btn kind="secondary" label="＋ New list" onPress={newList} />

      <Card>
        {L ? <>
          <Field defaultValue={L.name} key={'n' + L.id} onEndEditing={e => rename(e.nativeEvent.text)} accessibilityLabel="List name" style={{ fontWeight: '800' }} />
          <Field value={text} onChangeText={setText} placeholder="Type words, separated by spaces or commas" autoCapitalize="none" autoCorrect={false}
            multiline accessibilityLabel="New words" style={{ minHeight: 64 }} />
          <Row>
            <Btn label="Add words" onPress={add} disabled={!text.trim()} style={{ flex: 1 }} />
            <Btn kind="sky" label="📷 Scan list" onPress={() => router.push('/scan')} />
          </Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {L.words.map(w => (
              <Pressable key={w} onPress={() => say(w, kid.set)} onLongPress={() => { setWordSheet(w); setSentDraft(root.sent[norm(w)] || ''); }}
                accessibilityHint="Tap to hear. Hold for more options."
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: isMastered(kid.stats[norm(w)]) ? c.goodBg : '#f1f5f9', borderWidth: 1, borderColor: c.line }}>
                <Text style={{ fontSize: 17 * f, fontWeight: '700', color: c.ink }}>{w}</Text>
              </Pressable>
            ))}
          </View>
          {L.words.length > 0
            ? <P small>Tap a word to hear it. Hold a word to remove it or give it a sentence. Green = mastered.</P>
            : <P small>No words yet. Add some above, scan the school list, or start with a list below.</P>}
          <H style={{ fontSize: 17 * f }}>📝 Test date</H>
          <Row>
            <Chips value={L.test} onChange={setTest} options={[{ v: '', label: 'None' }, { v: fri, label: 'This Friday' }, { v: fri2, label: 'Next Friday' }]} />
          </Row>
          <Field defaultValue={L.test} key={'t' + L.id + L.test} onEndEditing={e => setTest(e.nativeEvent.text.trim())} placeholder="Or type a date: YYYY-MM-DD" accessibilityLabel="Test date" />
          <Btn kind="danger" small label="Delete this list" onPress={deleteList} />
        </> : <>
          <H>No lists yet</H>
          <P>Start a new list for this week's words, pick a grade-level list below, or try a quick-start list:</P>
          <Row>{Object.keys(STARTERS).map(k => <Btn key={k} small kind="secondary" label={k[0].toUpperCase() + k.slice(1)} onPress={() => starter(k)} />)}</Row>
        </>}
      </Card>

      <Card>
        <H>📘 Grade-level word lists</H>
        <P small>40 weeks of words for each grade band, grouped by spelling pattern and topic.</P>
        <Chips value={band} onChange={v => { setBand(v); setWeek(0); }} options={(Object.keys(BANDS) as Band[]).sort((a, b) => a === 'k1' ? -1 : b === 'k1' ? 1 : a.localeCompare(b)).map(b => ({ v: b, label: 'Gr ' + BANDS[b] }))} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {GRADE_LISTS[band].map((_, i) => {
            const on = i === week, has = kid.lists.some(l => l.src === `${band}-${i + 1}`);
            return (
              <Pressable key={i} onPress={() => setWeek(i)} accessibilityLabel={`Week ${i + 1}${has ? ', added' : ''}`}
                style={{ width: 42, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.brand : has ? c.goodBg : c.brandSoft }}>
                <Text style={{ fontWeight: '800', color: on ? '#fff' : c.brandDark }}>{i + 1}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ fontSize: 16 * f, fontWeight: '800', color: c.ink }}>Week {week + 1}: {GRADE_LISTS[band][week][0]}</Text>
        <P>{preview.join(', ')}</P>
        <Btn label={added ? '✓ Already added' : '＋ Add this list'} onPress={addGrade} disabled={added} />
      </Card>

      <Sheet visible={!!wordSheet} onClose={() => setWordSheet(null)}>
        {wordSheet && <>
          <H>{wordSheet}</H>
          <Btn kind="sky" label="🔊 Hear it" onPress={() => say(wordSheet, kid.set)} />
          <P>💬 Sentence for practice{builtinSent(wordSheet, kid.set.grade) && !root.sent[norm(wordSheet)] ? ' (a built-in one is used if you leave this empty)' : ''}</P>
          <Field value={sentDraft} onChangeText={setSentDraft} placeholder={builtinSent(wordSheet, kid.set.grade) || `A short sentence using "${wordSheet}"`} multiline accessibilityLabel="Sentence" />
          <Btn label="Save sentence" onPress={() => saveSentence(wordSheet)} />
          <Btn kind="danger" label="Remove word from this list" onPress={() => removeWord(wordSheet)} />
          <Btn kind="ghost" label="Close" onPress={() => setWordSheet(null)} />
        </>}
      </Sheet>
    </Screen>
  );
}
