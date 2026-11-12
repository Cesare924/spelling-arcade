import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { useApp } from '../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Row, C } from '../src/components/ui.tsx';
import { curList, norm, parseDay, weekName, uid, plural, isMastered } from '../src/logic/state.ts';
import { addWords, splitWords, addGradeList, nextGradeWeek } from '../src/logic/practice.ts';
import { BANDS, GRADE_LISTS } from '../src/data/gradeLists.ts';
import { say } from '../src/speech.ts';

export default function Words() {
  const { kid, updateKid } = useApp();
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const L = curList(kid);
  const band = kid.set.grade, nextWk = nextGradeWeek(kid, band);

  function add() {
    const raw = splitWords(text); if (!raw.length) return;
    let n = 0; updateKid(k => { n = addWords(k, raw, weekName()); });
    setText(''); setMsg(n ? `Added ${plural(n, 'word')}.` : 'Those words are already on the list.');
  }
  function newList() {
    updateKid(k => { const l = { id: uid(), name: weekName(), created: Date.now(), test: '', src: '', words: [] }; k.lists.push(l); k.cur = l.id; });
    setMsg('Started a new list.');
  }
  function addGrade() {
    updateKid(k => { addGradeList(k, band, nextGradeWeek(k, band)); });
    setMsg(`Added Grade ${BANDS[band]} week ${nextWk + 1}.`);
  }
  function removeWord(w: string) {
    updateKid(k => { const l = k.lists.find(x => x.id === k.cur); if (l) l.words = l.words.filter(x => norm(x) !== norm(w)); });
  }
  function deleteList(id: string, name: string) {
    Alert.alert('Delete list?', `"${name}" will be removed. Progress on its words is kept.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => updateKid(k => {
        k.lists = k.lists.filter(l => l.id !== id);
        if (k.cur === id) k.cur = k.lists.length ? k.lists[k.lists.length - 1].id : null;
      }) },
    ]);
  }
  function setTest(v: string) {
    updateKid(k => { const l = k.lists.find(x => x.id === k.cur); if (l) l.test = parseDay(v) ? v : ''; });
  }

  return (
    <Screen>
      <Card>
        <H>{L ? L.name : 'No list yet'}</H>
        <TextInput value={text} onChangeText={setText} placeholder="Type words, separated by spaces or commas"
          placeholderTextColor="#9ca3af" autoCapitalize="none" autoCorrect={false} multiline style={st.input}
          accessibilityLabel="New words" />
        <Row>
          <Btn label="Add words" onPress={add} disabled={!text.trim()} style={{ flex: 1 }} />
          <Btn kind="secondary" label="📷 Scan" onPress={() => Alert.alert('Coming soon', 'Camera scanning arrives in the next stage of the app.')} />
        </Row>
        {!!msg && <P style={{ color: C.good }}>{msg}</P>}
        {L && (
          <>
            <View style={st.words}>
              {L.words.map(w => (
                <Pressable key={w} onPress={() => say(w, kid.set)} onLongPress={() => removeWord(w)}
                  style={[st.word, isMastered(kid.stats[norm(w)]) && { backgroundColor: C.goodBg }]} accessibilityHint="Tap to hear, hold to remove">
                  <Text style={st.wordText}>{w}</Text>
                </Pressable>
              ))}
            </View>
            {L.words.length > 0 && <P style={{ fontSize: 13 }}>Tap a word to hear it. Hold to remove it. Green = mastered.</P>}
            <Row>
              <P>Test date:</P>
              <TextInput defaultValue={L.test} key={L.id} onEndEditing={e => setTest(e.nativeEvent.text)} placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af" style={[st.input, { flex: 1, minHeight: 0, paddingVertical: 8 }]} accessibilityLabel="Test date" />
            </Row>
          </>
        )}
        <Row>
          <Btn kind="secondary" label="➕ New list" onPress={newList} style={{ flex: 1 }} />
          <Btn kind="secondary" label={`📘 Gr ${BANDS[band]} Wk ${nextWk + 1}`} onPress={addGrade} style={{ flex: 1 }} />
        </Row>
        <P style={{ fontSize: 13 }}>Grade lists: {GRADE_LISTS[band][nextWk][0]} is next. Change the grade in Settings.</P>
      </Card>

      <Card>
        <H>All lists this year</H>
        {kid.lists.length === 0 && <P>None yet.</P>}
        {kid.lists.slice().reverse().map(l => (
          <Pressable key={l.id} onPress={() => updateKid(k => { k.cur = l.id; })} onLongPress={() => deleteList(l.id, l.name)}
            style={[st.list, l.id === kid.cur && { borderColor: C.brand, backgroundColor: '#ede9fe' }]}>
            <Text style={st.listName}>{l.name}</Text>
            <Text style={{ color: C.soft }}>{plural(l.words.length, 'word')}{l.test ? ` · test ${l.test}` : ''}</Text>
          </Pressable>
        ))}
        {kid.lists.length > 0 && <P style={{ fontSize: 13 }}>Tap to open a list. Hold to delete it.</P>}
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  input: { fontSize: 18, color: C.ink, borderWidth: 2, borderColor: C.line, borderRadius: 12, padding: 12, minHeight: 60, backgroundColor: '#fff' },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  word: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#f1f5f9' },
  wordText: { fontSize: 17, fontWeight: '700', color: C.ink },
  list: { borderWidth: 2, borderColor: C.line, borderRadius: 12, padding: 12 },
  listName: { fontSize: 16, fontWeight: '800', color: C.ink },
});
