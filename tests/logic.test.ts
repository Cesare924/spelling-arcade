// Run with: npm test   (node --experimental-strip-types)
import assert from 'node:assert/strict';
import { normalizeRoot, kidOf, allWords, trickyWords, dueWords, isMastered, streak, today, addDays } from '../src/logic/state.ts';
import { cleanWord, addWords, addGradeList, recordAttempt, roundStars, blankParts, builtinSent, makeTiles, roundWords, letterMarks } from '../src/logic/practice.ts';
import { GRADE_LISTS } from '../src/data/gradeLists.ts';
import { payout, LEVELS, MAX_PER_GAME } from '../src/logic/tickets.ts';
import { awardTickets, buyPrize, setLook, looksBySlot, famFor, famBlock, requestFam, answerReq, waitingReqs, setAside, goalOf, ticketsPerDay, adjustTickets } from '../src/logic/prizes.ts';
import { PRIZES } from '../src/data/prizes.ts';
import { GAME_IDS, AVATARS } from '../src/logic/state.ts';
import { lookIn } from '../src/logic/prizes.ts';
import { HOME_THEMES, TILE_THEMES, PRIZE_BY_ID } from '../src/data/prizes.ts';

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

test('a tampered backup cannot set impossible values or change prototypes', () => {
  const evil = JSON.parse(`{"profiles":[{"id":"a","name":"x","avatar":"🦄"}],"active":"a","P":{"a":{
    "lists":[{"id":"l","name":"L","words":["cat","<script>","a-very-very-very-long-word-that-is-too-long",5]}],
    "stats":{"__proto__":{"polluted":1},"cat":{"c":"9e99","b":99}},
    "set":{"grade":"zz","cost":-50,"tries":0,"mix":99999,"maxMin":-1},
    "tokens":-7,"best":{"derby":3,"__proto__":{"x":1},"nope":9}}},
    "sent":{"__proto__":{"polluted":2}}}`);
  const r = normalizeRoot(evil), k = kidOf(r);
  assert.deepEqual(k.lists[0].words, ['cat']);
  assert.equal(k.set.grade, '23'); assert.equal(k.set.cost, 1); assert.equal(k.set.tries, 1); assert.equal(k.set.mix, 30); assert.equal(k.set.maxMin, 0);
  assert.equal(k.tokens, 0); assert.equal(k.stats.cat.b, 5); assert.equal(k.stats.cat.c, 1e6);
  assert.deepEqual(k.best, { derby: 3 });
  assert.equal(({} as any).polluted, undefined); assert.equal((k.stats as any).polluted, undefined); assert.equal((r.sent as any).polluted, undefined);
});

/* ---------- tickets & prizes ---------- */
test('every game has rising ticket levels', () => {
  for (const id of GAME_IDS) { const [b, s, g] = LEVELS[id]; assert.ok(b > 0 && b < s && s < g, id); }
});
test('payout levels, new best and jackpot', () => {
  assert.equal(payout('bowling', 0, undefined, .99).total, 1);
  assert.equal(payout('bowling', 40, undefined, .99).level, 'bronze');
  const p = payout('bowling', 87, 60, .99);
  assert.equal(p.level, 'silver'); assert.equal(p.newBest, 4); assert.equal(p.total, 9); assert.equal(p.next, 100);
  assert.equal(payout('bowling', 87, 0, .99).newBest, 0, 'no best bonus without a real best');
  assert.equal(payout('bowling', 50, 60, .0).jackpot, 0, 'no jackpot on bronze');
  const top = payout('bowling', 100, 90, 0);
  assert.equal(top.total, MAX_PER_GAME); assert.equal(top.next, null);
});
test('awardTickets is capped per game and logs the day', () => {
  const k = kidOf(normalizeRoot(null));
  assert.equal(awardTickets(k, 9999), MAX_PER_GAME);
  assert.equal(awardTickets(k, -5), 0);
  assert.equal(k.tickets, MAX_PER_GAME); assert.equal(k.tday[today()], MAX_PER_GAME);
  assert.equal(ticketsPerDay(k), MAX_PER_GAME);
});
test('buying prizes, looks and goals', () => {
  const k = kidOf(normalizeRoot(null)); k.tickets = 120; k.goal = 'lk_hoops';
  assert.match(buyPrize(k, 'tp_teddy'), /180 more/);
  assert.equal(buyPrize(k, 'lk_hoops'), '');
  assert.equal(k.tickets, 20); assert.equal(k.tix.spent, 100); assert.equal(k.goal, '');
  assert.deepEqual(looksBySlot(k), { hoops: true }, 'a bought look turns on');
  assert.match(buyPrize(k, 'lk_hoops'), /already/);
  setLook(k, 'lk_hoops', false); assert.deepEqual(looksBySlot(k), {});
  setLook(k, 'lk_snake', true); assert.deepEqual(looksBySlot(k), {}, 'cannot turn on a look you do not own');
  assert.match(buyPrize(k, 'nope'), /gone/);
  k.tickets = 1000; buyPrize(k, 'lk_tiles'); buyPrize(k, 'lk_ocean');
  assert.equal(lookIn(k, 'tiles'), 'lk_ocean', 'a new look in the same slot replaces the old one');
  setLook(k, 'lk_tiles', true); assert.equal(lookIn(k, 'tiles'), 'lk_tiles');
  assert.equal(k.looksOn.filter(id => PRIZE_BY_ID[id].slot === 'tiles').length, 1);
  for (const id of Object.keys(HOME_THEMES)) assert.equal(PRIZE_BY_ID[id]?.slot, 'home', id);
  for (const id of Object.keys(TILE_THEMES)) assert.equal(PRIZE_BY_ID[id]?.slot, 'tiles', id);
});
test('prize ids are unique and prices sensible', () => {
  assert.equal(new Set(PRIZES.map(p => p.id)).size, PRIZES.length);
  for (const p of PRIZES) assert.ok(p.price >= 10 && p.price <= 1500, p.id);
  assert.ok(PRIZES.length >= 70, 'a big Prize Counter');
  for (const kind of ['sticker', 'avatar', 'look', 'trophy']) { const ems = PRIZES.filter(x => x.kind === kind).map(x => x.em); assert.equal(new Set(ems).size, ems.length, 'no duplicate pictures on the ' + kind + ' shelf'); }
  for (const p of PRIZES.filter(x => x.kind === 'look')) assert.ok(p.slot && p.where, p.id);
  for (const p of PRIZES.filter(x => x.kind === 'avatar')) assert.ok(!AVATARS.includes(p.em), 'prize avatars are new: ' + p.em);
});
test('family prize request, limits, answer and refund', () => {
  const r = normalizeRoot(null), kidId = r.active, k = kidOf(r);
  r.fam.prizes.push({ id: 'p1', name: 'Pick dinner', em: '🍝', price: 150, freq: 'week', kids: [] });
  const p = famFor(r, kidId)[0];
  k.tickets = 100; assert.match(famBlock(k, p), /50 more/);
  k.tickets = 400; k.goal = 'fam:p1';
  assert.deepEqual(goalOf(r, k, kidId), { em: '🍝', name: 'Pick dinner', price: 150 });
  const now = Date.now();
  assert.equal(requestFam(k, p, now), '');
  assert.equal(k.tickets, 250); assert.equal(setAside(k), 150); assert.equal(k.goal, '');
  assert.match(famBlock(k, p, now), /already asked/);
  assert.equal(waitingReqs(r).length, 1);
  answerReq(k, k.famReq[0].id, false, now);
  assert.equal(k.tickets, 400, '"not now" refunds'); assert.equal(setAside(k), 0);
  assert.equal(requestFam(k, p, now), '');
  answerReq(k, k.famReq[1].id, true, now);
  assert.equal(k.tickets, 250); assert.equal(k.tix.spent, 150);
  answerReq(k, k.famReq[1].id, false, now); assert.equal(k.tickets, 250, 'an answered request cannot be answered again');
  assert.match(famBlock(k, p, now + 2 * 864e5), /again in 5 days/);
  assert.equal(famBlock(k, p, now + 8 * 864e5), '');
  r.fam.on = false; assert.equal(famFor(r, kidId).length, 0);
});
test('family prizes can be limited to some kids, and removing a kid cleans up', () => {
  const r = normalizeRoot(null), a = r.active, b = addKid(r)!.id;
  r.fam.prizes.push({ id: 'p2', name: 'Ice cream', em: '🍦', price: 400, freq: 'once', kids: [b] });
  assert.equal(famFor(r, a).length, 0); assert.equal(famFor(r, b).length, 1);
  removeKid(r, b); assert.deepEqual(r.fam.prizes[0].kids, []);
});
test('saved prize data is checked on load', () => {
  const r = normalizeRoot(null), id = r.active;
  const raw: any = JSON.parse(JSON.stringify(r));
  Object.assign(raw.P[id], { tickets: -50, owned: ['st_rocket', 'fake', 'st_rocket'], looksOn: ['lk_snake', 'st_rocket'], goal: 'x'.repeat(99),
    famReq: [{ name: '<b>Hi</b>', em: '💣', price: 1e9, st: 'weird' }, { name: '' }] });
  raw.fam = { on: false, prizes: [{ name: 'Park', em: '🌳', price: 0, freq: 'daily', kids: [1, 'k'] }, { name: '   ' }, 'junk'] };
  raw.profiles[0].avatar = '🤖';
  const r2 = normalizeRoot(raw), k = kidOf(r2);
  assert.equal(k.tickets, 0); assert.deepEqual(k.owned, ['st_rocket']); assert.deepEqual(k.looksOn, []); assert.equal(k.goal, '');
  assert.equal(k.famReq.length, 1); assert.equal(k.famReq[0].name, 'bHi/b'); assert.equal(k.famReq[0].em, '🎁');
  assert.equal(k.famReq[0].price, 5000); assert.equal(k.famReq[0].st, 'no');
  assert.equal(r2.fam.on, false); assert.equal(r2.fam.prizes.length, 1);
  assert.deepEqual(r2.fam.prizes[0], { id: r2.fam.prizes[0].id, name: 'Park', em: '🌳', price: 5, freq: 'any', kids: ['k'] });
  assert.equal(r2.profiles[0].avatar, '🤖', 'prize avatars are allowed');
  adjustTickets(k, -10); assert.equal(k.tickets, 0);
});

console.log(`\n${passed} tests passed`);
