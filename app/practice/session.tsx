import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useApp } from '../../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Row, Tiles, C } from '../../src/components/ui.tsx';
import { norm, plural, type Kid } from '../../src/logic/state.ts';
import {
  roundWords, recordAttempt, roundStars, builtinSent, blankParts, makePattern, makeTiles, usesTiles, letterMarks,
  type Mode, type Style, type CheckResult,
} from '../../src/logic/practice.ts';
import { sayWord, say, stopSpeech } from '../../src/speech.ts';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export default function Session() {
  const params = useLocalSearchParams<{ mode?: string; list?: string; style?: string }>();
  const mode = (params.mode || 'year') as Mode, style = (params.style || 'spell') as Style;
  const { kid, root, updateKid } = useApp();
  const set = kid.set;

  // The round's words are fixed when the screen opens.
  const [words] = useState(() => roundWords(kid, mode, params.list));
  const [idx, setIdx] = useState(0);
  const [tryIdx, setTryIdx] = useState(0);
  const [guess, setGuess] = useState('');
  const [usedOrder, setUsedOrder] = useState<number[]>([]);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [lastGuess, setLastGuess] = useState('');
  const [peeked, setPeeked] = useState(false);
  const [showPeek, setShowPeek] = useState(false);
  const firstRight = useRef(0);
  const [done, setDone] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const word = words[idx];
  const sentence = useMemo(() => word ? (root.sent[norm(word)] || builtinSent(word, set.grade)) : '', [word]);
  const pattern = useMemo(() => word && style === 'missing' ? makePattern(word) : '', [word, style]);
  const tileMode = usesTiles(kid, style);
  const tiles = useMemo(() => word && tileMode ? makeTiles(word, style === 'unscramble') : [], [word, tileMode, style]);

  useEffect(() => { if (word) sayWord(word, set, style === 'spell' ? sentence : undefined); }, [idx]);
  useEffect(() => () => { stopSpeech(); if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  if (!words.length) {
    return <Screen><Card><H>No words here yet</H><P>Add words in My Words, then come back.</P>
      <Btn label="Go to My Words" onPress={() => router.replace('/words')} /></Card></Screen>;
  }

  const current = tileMode ? usedOrder.map(i => tiles[i]).join('') : guess;

  function submit() {
    if (!current.trim() || result?.correct || result?.reveal) return;
    // Work out the result on a copy for the screen, and apply the same change to saved data.
    const res = recordAttempt(clone(kid) as Kid, word, current, tryIdx, set.caps);
    updateKid(k => { recordAttempt(k, word, current, tryIdx, set.caps); });
    if (res.correct && tryIdx === 0) firstRight.current++;
    setResult(res); setLastGuess(current);
    if (res.correct) {
      say(res.earned > 1 ? 'Correct! Two tokens!' : 'Correct!', set);
      advanceTimer.current = setTimeout(next, 1300); // move on automatically
    } else if (!res.reveal) {
      say('Try again', set); setTryIdx(t => t + 1); setGuess(''); setUsedOrder([]);
    } else {
      say(`The word is ${word}`, set);
    }
  }

  function next() {
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null; }
    if (idx + 1 >= words.length) {
      const stars = roundStars(firstRight.current, words.length);
      updateKid(k => { k.stars += stars; });
      setEarnedStars(stars); setDone(true); return;
    }
    setIdx(i => i + 1); setTryIdx(0); setGuess(''); setUsedOrder([]); setResult(null); setPeeked(false); setShowPeek(false);
  }

  function peek() {
    if (set.peek === 'off' || (set.peek === 'once' && peeked)) return;
    setPeeked(true); setShowPeek(true); setTimeout(() => setShowPeek(false), 1500);
  }

  if (done) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Round done!' }} />
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>{'⭐'.repeat(earnedStars)}</Text>
          <H>Great work!</H>
          <P>{firstRight.current} of {plural(words.length, 'word')} right on the first try.</P>
          <P>You have {plural(kid.tokens, 'token')} to spend.</P>
        </Card>
        <Btn big kind="good" label="🎮 Game Arcade" onPress={() => router.replace('/arcade')} />
        <Btn kind="secondary" label="Practice again" onPress={() => router.replace({ pathname: '/practice/session', params })} />
        <Btn kind="ghost" label="Home" onPress={() => router.dismissAll()} />
      </Screen>
    );
  }

  const locked = !!result && (result.correct || result.reveal);
  return (
    <Screen>
      <Stack.Screen options={{ title: `Word ${idx + 1} of ${words.length}` }} />
      <Card style={{ alignItems: 'center' }}>
        <Row style={{ justifyContent: 'center' }}>
          <Btn label="🔊 Hear it" onPress={() => sayWord(word, set, style === 'spell' ? sentence : undefined)} />
          <Btn kind="secondary" label="🐢 Slow" onPress={() => say(word, set, { slower: true })} />
          {set.peek !== 'off' && style === 'spell' && <Btn kind="ghost" label="👀 Peek" onPress={peek} disabled={set.peek === 'once' && peeked} />}
        </Row>

        {style === 'spell' && (showPeek
          ? <Text style={st.big}>{word}</Text>
          : sentence && set.sentence ? <Sentence text={sentence} word={word} /> : <P>Listen and spell the word.</P>)}
        {style === 'missing' && <Text style={st.big} accessibilityLabel="word with missing letters">{[...pattern].join(' ')}</Text>}
        {style === 'unscramble' && <P>Put the letters in order.</P>}
      </Card>

      <Card>
        {tileMode ? (
          <>
            <View style={st.answerBox}><Text style={st.answer}>{current || ' '}</Text></View>
            <Tiles tiles={tiles} used={tiles.map((_, i) => usedOrder.includes(i))}
              onTap={i => !locked && setUsedOrder(o => [...o, i])} />
            <Row style={{ justifyContent: 'center' }}>
              <Btn kind="secondary" label="⌫ Undo" onPress={() => setUsedOrder(o => o.slice(0, -1))} disabled={locked || !usedOrder.length} />
              <Btn kind="secondary" label="Clear" onPress={() => setUsedOrder([])} disabled={locked || !usedOrder.length} />
            </Row>
          </>
        ) : (
          <TextInput value={guess} onChangeText={setGuess} onSubmitEditing={submit} editable={!locked}
            autoCapitalize="none" autoCorrect={false} spellCheck={false} autoComplete="off" autoFocus
            placeholder="Type the word" placeholderTextColor="#9ca3af" returnKeyType="done" style={st.input}
            accessibilityLabel="Your spelling" />
        )}

        {!locked && <Btn big label="Check ✓" onPress={submit} disabled={!current.trim()} />}

        {result && !result.correct && !result.reveal && (
          <View style={[st.fb, { backgroundColor: C.badBg }]}>
            <Text style={st.fbText}>{result.caseOnly ? 'Check your capital letters!' : 'Not quite — try again!'} ({plural(result.triesLeft, 'try')} left)</Text>
          </View>
        )}
        {result?.correct && (
          <View style={[st.fb, { backgroundColor: C.goodBg }]}>
            <Text style={st.fbText}>🎉 Correct! +{plural(result.earned, 'token')}</Text>
          </View>
        )}
        {result?.reveal && (
          <View style={[st.fb, { backgroundColor: '#fef3c7' }]}>
            <Text style={st.fbText}>The word is <Text style={{ fontWeight: '900' }}>{word}</Text></Text>
            <Row style={{ justifyContent: 'center', gap: 2 }}>
              {letterMarks(lastGuess.toLowerCase(), word.toLowerCase()).map((m, i) => (
                <Text key={i} style={[st.mark, { color: m.mark === 'ok' ? C.good : C.bad }]}>{m.ch}</Text>
              ))}
            </Row>
            <Btn label="Next word →" onPress={next} />
          </View>
        )}
      </Card>
    </Screen>
  );
}

/** Sentence with the word hidden; each blank has one dash per letter. */
function Sentence({ text, word }: { text: string; word: string }) {
  return (
    <Text style={st.sentence}>
      {blankParts(text, word).map((p, i) => p.text != null
        ? <Text key={i}>{p.text}</Text>
        : <Text key={i} style={st.blank} accessibilityLabel="blank">{' _'.repeat(p.blank!).trim()}</Text>)}
    </Text>
  );
}

const st = StyleSheet.create({
  big: { fontSize: 36, fontWeight: '900', color: C.ink, letterSpacing: 2, textAlign: 'center' },
  sentence: { fontSize: 20, color: C.ink, textAlign: 'center', lineHeight: 30 },
  blank: { fontWeight: '900', color: C.brand, letterSpacing: 1 },
  input: { fontSize: 28, fontWeight: '800', color: C.ink, borderWidth: 2, borderColor: C.line, borderRadius: 14, padding: 14, textAlign: 'center', backgroundColor: '#fff' },
  answerBox: { minHeight: 58, borderWidth: 2, borderColor: C.line, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  answer: { fontSize: 30, fontWeight: '900', color: C.ink, letterSpacing: 3 },
  fb: { borderRadius: 14, padding: 12, gap: 8, alignItems: 'center' },
  fbText: { fontSize: 18, color: C.ink, fontWeight: '700', textAlign: 'center' },
  mark: { fontSize: 24, fontWeight: '900' },
});
