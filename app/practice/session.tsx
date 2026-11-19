import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useApp } from '../../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Row, Tiles, IconBtn, useLook, Coin } from '../../src/components/ui.tsx';
import { KidHelp } from '../../src/components/overlays.tsx';
import { norm, plural, streak, type Kid } from '../../src/logic/state.ts';
import {
  roundWords, recordAttempt, roundStars, builtinSent, builtinMean, blankParts, makePattern, makeTiles, usesTiles, letterMarks, pick,
  type Mode, type Style, type CheckResult,
} from '../../src/logic/practice.ts';
import { sayWord, say, stopSpeech } from '../../src/speech.ts';
import { sfx } from '../../src/sfx.ts';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const CHEERS = ['Awesome!', 'You got it!', 'Super speller!', 'Fantastic!', 'Way to go!', 'Spelling star!', 'Nailed it!', 'Brilliant!'];

export default function Session() {
  const params = useLocalSearchParams<{ mode?: string; list?: string; style?: string }>();
  const mode = (params.mode || 'year') as Mode, style = (params.style || 'spell') as Style;
  const { kid, root, updateKid } = useApp();
  const { c, f } = useLook();
  const set = kid.set;

  // The round's words are fixed when the screen opens.
  const [words] = useState(() => roundWords(kid, mode, params.list));
  const [idx, setIdx] = useState(0);
  const [tryIdx, setTryIdx] = useState(0);
  const [guess, setGuess] = useState('');
  const [usedOrder, setUsedOrder] = useState<number[]>([]);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [cheer, setCheer] = useState('');
  const [lastGuess, setLastGuess] = useState('');
  const [peeked, setPeeked] = useState(false);
  const [showPeek, setShowPeek] = useState(false);
  const [extra, setExtra] = useState<{ kind: 'sent' | 'mean'; text: string } | null>(null);
  const [help, setHelp] = useState(false);
  const firstRight = useRef(0);
  const [done, setDone] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const word = words[idx];
  const sentence = useMemo(() => word ? (root.sent[norm(word)] || builtinSent(word, set.grade)) : '', [word]);
  const meaning = useMemo(() => word ? (root.defs[norm(word)] || builtinMean(word)) : '', [word]);
  const pattern = useMemo(() => word && style === 'missing' ? makePattern(word) : '', [word, style]);
  const tileMode = usesTiles(kid, style);
  const tiles = useMemo(() => word && tileMode ? makeTiles(word, style === 'unscramble') : [], [word, tileMode, style]);

  useEffect(() => { if (word) sayWord(word, set); }, [idx]);
  useEffect(() => () => { stopSpeech(); if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  if (!words.length) {
    return <Screen><Card><H>No words here yet</H><P>Pick a different practice, or ask a grown-up to add words.</P>
      <Btn label="Back" onPress={() => router.back()} /></Card></Screen>;
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
      const ch = pick(CHEERS); setCheer(ch);
      sfx('correct', set.sfx); setTimeout(() => sfx('coin', set.sfx), 350);
      say(res.earned > 1 ? `${ch} Two tokens!` : ch, set);
      advanceTimer.current = setTimeout(next, 1400); // move on automatically
    } else if (!res.reveal) {
      sfx('wrong', set.sfx); say('Try again', set); setTryIdx(t => t + 1); setGuess(''); setUsedOrder([]);
    } else {
      sfx('wrong', set.sfx); say(`The word is ${word}`, set);
    }
  }

  function next() {
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null; }
    if (idx + 1 >= words.length) {
      const stars = roundStars(firstRight.current, words.length);
      updateKid(k => { k.stars += stars; });
      sfx('win', set.sfx);
      setEarnedStars(stars); setDone(true); return;
    }
    setIdx(i => i + 1); setTryIdx(0); setGuess(''); setUsedOrder([]); setResult(null); setPeeked(false); setShowPeek(false); setExtra(null);
  }

  function peek() {
    if (set.peek === 'off' || (set.peek === 'once' && peeked)) return;
    setPeeked(true); setShowPeek(true); setTimeout(() => setShowPeek(false), 1500);
  }
  function showSentence() { setExtra({ kind: 'sent', text: sentence }); say(`${word}. ${sentence} ${word}.`, set); }
  function showMeaning() { setExtra({ kind: 'mean', text: meaning }); say(`${word}. ${meaning}`, set); }

  if (done) {
    const days = streak(kid);
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Round done!' }} />
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>{'⭐'.repeat(earnedStars)}</Text>
          <H>Round complete!</H>
          <P style={{ textAlign: 'center' }}>{firstRight.current} of {plural(words.length, 'word')} right on the first try.</P>
          <P style={{ textAlign: 'center' }}>You have {plural(kid.tokens, 'token')} to spend.</P>
          {days > 1 && <P style={{ textAlign: 'center' }}>🔥 {days}-day streak! Keep it going tomorrow.</P>}
        </Card>
        <Btn big kind="good" label="🎮 Game Arcade" onPress={() => router.replace('/arcade')} />
        <Btn kind="secondary" label="Practice again" onPress={() => router.replace({ pathname: '/practice/session', params })} />
        <Btn kind="ghost" label="Home" onPress={() => router.dismissAll()} />
      </Screen>
    );
  }

  const locked = !!result && (result.correct || result.reveal);
  const helpSteps: [string, string][] = [];
  if (set.voice) helpSteps.push(['🔊', 'Tap Hear it to hear the word again.']);
  if (style === 'unscramble') helpSteps.push(['🔀', 'The letters are all mixed up. Tap them in the right order.']);
  else if (style === 'missing') helpSteps.push(['🧩', 'Some letters are missing. Spell the whole word.']);
  helpSteps.push(tileMode ? ['🔤', 'Tap the letter tiles to spell the word. Tap ⌫ to take one back.'] : ['⌨️', 'Type the word in the box.']);
  helpSteps.push(['✅', 'Tap Check. Green letters are right. Red letters need fixing.']);
  if (set.peek !== 'off') helpSteps.push(['👀', set.peek === 'once' ? 'Stuck? Tap Peek to see the word once.' : 'Stuck? Tap Peek for a quick look.']);
  helpSteps.push(['🪙', 'Every word you get right earns a token for games!']);

  return (
    <Screen keyboardEnd={!tileMode}>
      <Stack.Screen options={{ title: `Word ${idx + 1} of ${words.length}`, headerRight: () => <IconBtn icon="❓" label="How to practice" onPress={() => setHelp(true)} /> }} />
      <View style={{ height: 8, borderRadius: 4, backgroundColor: c.line, overflow: 'hidden' }}>
        <View style={{ width: `${(idx / words.length) * 100}%`, height: 8, backgroundColor: c.brand }} />
      </View>
      <Card style={{ alignItems: 'center' }}>
        <Row style={{ justifyContent: 'center' }}>
          <Btn label="🔊 Hear it" onPress={() => sayWord(word, set)} />
          <Btn kind="secondary" label="🐢 Slow" onPress={() => say(word, set, { slower: true })} />
          {set.peek !== 'off' && style === 'spell' && <Btn kind="ghost" label="👀 Peek" onPress={peek} disabled={set.peek === 'once' && peeked} />}
        </Row>
        <Row style={{ justifyContent: 'center' }}>
          {set.sentence && !!sentence && <Btn small kind="secondary" label="💬 Sentence" onPress={showSentence} />}
          {!!meaning && (set.grade === '46' || !sentence) && <Btn small kind="secondary" label="📖 Meaning" onPress={showMeaning} />}
        </Row>

        {style === 'spell' && showPeek && <Text style={{ fontSize: 36 * f, fontWeight: '900', color: c.ink, letterSpacing: 2 }}>{word}</Text>}
        {style === 'spell' && !showPeek && !extra && <P>Listen and spell the word.</P>}
        {style === 'missing' && <Text style={{ fontSize: 36 * f, fontWeight: '900', color: c.ink, letterSpacing: 2 }} accessibilityLabel="word with missing letters">{[...pattern].join(' ')}</Text>}
        {style === 'unscramble' && <P>Put the letters in order.</P>}
        {extra && <Blanked text={(extra.kind === 'sent' ? '💬 ' : '📖 ') + extra.text} word={word} />}
        {!set.voice && style === 'spell' && <P small>Spoken words are off, so tap 👀 Peek to see the word.</P>}
      </Card>

      <Card>
        {tileMode ? (
          <>
            <View style={{ minHeight: 58, borderWidth: 2, borderColor: c.line, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
              <Text style={{ fontSize: 30 * f, fontWeight: '900', color: c.ink, letterSpacing: 3 }}>{current || ' '}</Text>
            </View>
            <Tiles tiles={tiles} used={tiles.map((_, i) => usedOrder.includes(i))} onTap={i => !locked && setUsedOrder(o => [...o, i])} />
            <Row style={{ justifyContent: 'center' }}>
              <Btn kind="secondary" label="⌫ Undo" onPress={() => setUsedOrder(o => o.slice(0, -1))} disabled={locked || !usedOrder.length} />
              <Btn kind="secondary" label="Clear" onPress={() => setUsedOrder([])} disabled={locked || !usedOrder.length} />
            </Row>
          </>
        ) : (
          <TextInput value={guess} onChangeText={setGuess} onSubmitEditing={submit} editable={!locked}
            autoCapitalize="none" autoCorrect={false} spellCheck={false} autoComplete="off" autoFocus
            placeholder="Type the word" placeholderTextColor="#8b8fa8" returnKeyType="done" blurOnSubmit={false}
            style={{ fontSize: 28 * f, fontWeight: '800', color: c.ink, borderWidth: 2, borderColor: c.line, borderRadius: 14, padding: 14, textAlign: 'center', backgroundColor: '#fff' }}
            accessibilityLabel="Your spelling" />
        )}

        {!locked && <Btn big label="Check ✓" onPress={submit} disabled={!current.trim()} />}

        {result && !result.correct && !result.reveal && (
          <View style={{ borderRadius: 14, padding: 12, gap: 8, alignItems: 'center', backgroundColor: c.badBg }}>
            <Row style={{ justifyContent: 'center', gap: 2 }}>
              {letterMarks(lastGuess.toLowerCase(), word.toLowerCase()).filter(m => m.mark !== 'miss').map((m, i) => (
                <Text key={i} style={{ fontSize: 24 * f, fontWeight: '900', color: m.mark === 'ok' ? c.good : c.bad }}>{m.ch}</Text>
              ))}
            </Row>
            <Text style={{ fontSize: 18 * f, color: c.ink, fontWeight: '700', textAlign: 'center' }}>{result.caseOnly ? 'Check your capital letters!' : 'Not quite — try again!'} ({plural(result.triesLeft, 'try')} left)</Text>
          </View>
        )}
        {result?.correct && (
          <View style={{ borderRadius: 14, padding: 12, alignItems: 'center', backgroundColor: c.goodBg }}>
            <Text style={{ fontSize: 20 * f, color: c.ink, fontWeight: '800', textAlign: 'center' }}>🎉 {cheer} +{plural(result.earned, 'token')} <Coin size={20 * f} /></Text>
          </View>
        )}
        {result?.reveal && (
          <View style={{ borderRadius: 14, padding: 12, gap: 8, alignItems: 'center', backgroundColor: c.sunSoft }}>
            <Text style={{ fontSize: 18 * f, color: c.ink, fontWeight: '700' }}>The word is <Text style={{ fontWeight: '900' }}>{word}</Text></Text>
            <Row style={{ justifyContent: 'center', gap: 2 }}>
              {letterMarks(lastGuess.toLowerCase(), word.toLowerCase()).map((m, i) => (
                <Text key={i} style={{ fontSize: 24 * f, fontWeight: '900', color: m.mark === 'ok' ? c.good : c.bad }}>{m.ch}</Text>
              ))}
            </Row>
            <P small>It'll come back later so you can try again.</P>
            <Btn label="Next word ➜" onPress={next} />
          </View>
        )}
      </Card>
      <KidHelp visible={help} onClose={() => setHelp(false)} title="How to practice" steps={helpSteps} />
    </Screen>
  );
}

/** Sentence or meaning with the word hidden; each blank has one dash per letter. */
function Blanked({ text, word }: { text: string; word: string }) {
  const { c, f } = useLook();
  return (
    <Text style={{ fontSize: 19 * f, color: c.ink, textAlign: 'center', lineHeight: 28 * f }}>
      {blankParts(text, word).map((p, i) => p.text != null
        ? <Text key={i}>{p.text}</Text>
        : <Text key={i} style={{ fontWeight: '900', color: c.brand, letterSpacing: 1 }} accessibilityLabel="blank">{' _'.repeat(p.blank!).trim()}</Text>)}
    </Text>
  );
}
