// Run with: npm test   (node --experimental-strip-types)
import assert from 'node:assert/strict';
import { normalizeRoot, kidOf, allWords, trickyWords, dueWords, isMastered, streak, today, addDays } from '../src/logic/state.ts';
import { cleanWord, addWords, addGradeList, recordAttempt, roundStars, blankParts, builtinSent, makeTiles, roundWords, letterMarks } from '../src/logic/practice.ts';
import { GRADE_LISTS } from '../src/data/gradeLists.ts';

let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; console.log('ok -', name); };

test('fresh root has one profile and default settings', () => {
  const r = normalizeRoot(null);
  assert.equal(r.profiles.length, 1);
  assert.equal(kidOf(r).set.tries, 2);
  assert.equal(kidOf(r).tokens, 0);
});

test('old single-kid prototype data migrates', () => {
  const r = normalizeRoot({ words: ['cat', 'dog'], tokens: 5, muted: true });
  const k = kidOf(r);
  assert.deepEqual(allWords(k), ['cat', 'dog']);
  assert.equal(k.tokens, 5);
  assert.equal(k.set.sfx, false);
});

test('web backup format round-trips', () => {
  const r = normalizeRoot(null); const k = kidOf(r);
  addWords(k, ['apple', 'banana'], 'Wk 1'); k.tokens = 7;
  const r2 = normalizeRoot(JSON.parse(JSON.stringify(r)));
  assert.deepEqual(allWords(kidOf(r2)), ['apple', 'banana']);
  assert.equal(kidOf(r2).tokens, 7);
});

test('cleanWord trims punctuation and rejects junk', () => {
  assert.equal(cleanWord(' "hello," '), 'hello');
  assert.equal(cleanWord("don’t"), "don't");
  assert.equal(cleanWord('123'), null);
  assert.equal(cleanWord('a'.repeat(30)), null);
});

test('addWords skips duplicates case-insensitively', () => {
  const k = kidOf(normalizeRoot(null));
  assert.equal(addWords(k, ['Cat', 'cat', 'dog'], 'L'), 2);
  assert.equal(addWords(k, ['DOG', 'fish'], 'L'), 1);
});

test('grade list adds once', () => {
  const k = kidOf(normalizeRoot(null));
  assert.ok(addGradeList(k, '23', 0));
  assert.equal(addGradeList(k, '23', 0), null);
  assert.equal(GRADE_LISTS['23'].length, 40);
});

test('first-try correct earns a token and moves the review box up', () => {
  const k = kidOf(normalizeRoot(null)); addWords(k, ['cat'], 'L');
  const res = recordAttempt(k, 'cat', ' CAT ', 0, false);
  assert.equal(res.correct, true); assert.equal(k.tokens, 1);
  assert.equal(k.stats.cat.b, 1); assert.equal(k.stats.cat.due, addDays(1));
  assert.ok(isMastered(k.stats.cat));
});

test('a miss makes the word tricky and due today; reveal after tries run out', () => {
  const k = kidOf(normalizeRoot(null)); addWords(k, ['cat'], 'L');
  const a = recordAttempt(k, 'cat', 'kat', 0, false);
  assert.equal(a.correct, false); assert.equal(a.reveal, false); assert.equal(a.triesLeft, 1);
  const b = recordAttempt(k, 'cat', 'kot', 1, false);
  assert.equal(b.reveal, true);
  assert.deepEqual(trickyWords(k), ['cat']);
  assert.deepEqual(dueWords(k), ['cat']);
  assert.equal(k.stats.cat.due, today());
  assert.equal(streak(k), 1);
});

test('first-try bonus gives 2 tokens', () => {
  const k = kidOf(normalizeRoot(null)); k.set.firstBonus = true;
  assert.equal(recordAttempt(k, 'sun', 'sun', 0, false).earned, 2);
});

test('case-sensitive mode flags case-only mistakes', () => {
  const k = kidOf(normalizeRoot(null));
  const r = recordAttempt(k, 'Monday', 'monday', 0, true);
  assert.equal(r.correct, false); assert.equal(r.caseOnly, true);
});

test('stars by accuracy', () => {
  assert.equal(roundStars(10, 10), 3); assert.equal(roundStars(7, 10), 2); assert.equal(roundStars(2, 10), 1);
});

test('sentence blanks keep the word length', () => {
  const parts = blankParts('The cat sat on the mat.', 'cat');
  assert.deepEqual(parts, [{ text: 'The ' }, { blank: 3 }, { text: ' sat on the mat.' }]);
});

test('built-in sentence found for a grade word', () => {
  const w = GRADE_LISTS['23'][0][1].split(' ')[0];
  assert.ok(builtinSent(w, '23').length > 0, 'missing sentence for ' + w);
});

test('tiles contain all letters of the word', () => {
  const t = makeTiles('rabbit', true);
  assert.equal(t.slice().sort().join(''), 'abbirt');
  assert.ok(makeTiles('cat', false).length > 3);
});

test('year mix respects mix size', () => {
  const k = kidOf(normalizeRoot(null));
  for (let i = 0; i < 5; i++) addGradeList(k, '23', i);
  k.set.mix = 10;
  assert.equal(roundWords(k, 'year').length, 10);
});

test('letter marks', () => {
  assert.deepEqual(letterMarks('ct', 'cat').map(m => m.mark), ['ok', 'bad', 'miss']);
});


import { dayRec, limitReason, addKid, removeKid } from '../src/logic/state.ts';
import { backupText, readBackup } from '../src/logic/backup.ts';
import { wordsFromScan } from '../src/logic/scan.ts';

test('daily limits', () => {
  const k = kidOf(normalizeRoot(null)); k.set.maxGames = 2; dayRec(k).games = 2;
  assert.match(limitReason(k), /2 games/);
  k.set.maxGames = 0; k.set.maxMin = 10; dayRec(k).ms = 11 * 60000;
  assert.match(limitReason(k), /10 min/);
});

test('add and remove kids', () => {
  const r = normalizeRoot(null); const p = addKid(r)!;
  assert.equal(r.profiles.length, 2); assert.notEqual(p.avatar, r.profiles[0].avatar);
  r.active = p.id; removeKid(r, p.id);
  assert.equal(r.profiles.length, 1); assert.equal(r.active, r.profiles[0].id);
});

test('backup round trip and rejects junk', () => {
  const r = normalizeRoot(null); addWords(kidOf(r), ['zebra'], 'L');
  const b = readBackup(backupText(r))!;
  assert.deepEqual(allWords(kidOf(b.r)), ['zebra']); assert.ok(b.savedAt);
  assert.equal(readBackup('hello'), null); assert.equal(readBackup('{"x":1}'), null);
});

test('scan text becomes words', () => {
  const got = wordsFromScan(['Spelling Words  Week 5', '1. Friend 2. night', '3) because, NIGHT', 'Name: ____ Date:'], ['because']);
  assert.deepEqual(got, ['friend', 'night']);
});


test('every grade-list word has a built-in sentence that uses it', async () => {
  const { BUILT_SENT } = await import('../src/data/sentences.ts');
  const { gradeWords } = await import('../src/data/gradeLists.ts');
  for (const b of ['k1', '23', '46'] as const) for (let i = 0; i < GRADE_LISTS[b].length; i++) for (const w of gradeWords(b, i)) {
    const s = BUILT_SENT[b][w]; assert.ok(s, `${b} ${w} has no sentence`);
    assert.ok(s.toLowerCase().includes(w.toLowerCase()), `${b} ${w}: sentence does not use the word`);
  }
});
console.log(`\n${passed} tests passed`);
