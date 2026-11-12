// Practice rules: word cleaning, round building, answer checking, spaced review and rewards.
// Pure functions that change a Kid record in place; the store clones state before calling them.
import { BANDS, GRADE_LISTS, gradeWords, type Band } from '../data/gradeLists.ts';
import { BUILT_SENT, BUILT_MEAN } from '../data/sentences.ts';
import {
  type Kid, type WordList, allWords, dueWords, trickyWords, norm, today, addDays, uid, upcomingTest,
} from './state.ts';

export type Mode = 'list' | 'year' | 'tricky' | 'due' | 'all';
export type Style = 'spell' | 'unscramble' | 'missing';
export const BOX_DAYS = [0, 1, 3, 7, 14, 30];

export const shuffle = <T,>(a: T[]): T[] => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

/* ---------- words ---------- */
export function cleanWord(w: string): string | null {
  const s = String(w || '').trim().replace(/[’‘]/g, "'").replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
  if (!s || s.length > 24 || !/^[A-Za-z][A-Za-z'\-]*$/.test(s)) return null;
  return s;
}
export function splitWords(text: string): string[] { return text.split(/[\s,;]+/).filter(Boolean); }

export function ensureList(k: Kid, name: string): WordList {
  let l = k.lists.find(x => x.id === k.cur);
  if (!l) { l = { id: uid(), name, created: Date.now(), test: '', src: '', words: [] }; k.lists.push(l); k.cur = l.id; }
  return l;
}
/** Adds words to the current list; returns how many were new. */
export function addWords(k: Kid, raw: string[], newListName: string): number {
  const L = ensureList(k, newListName); const have = new Set(L.words.map(norm)); let n = 0;
  for (const r of raw) { const w = cleanWord(r); if (!w) continue; const key = norm(w); if (have.has(key)) continue; have.add(key); L.words.push(w); n++; }
  return n;
}
export function addGradeList(k: Kid, band: Band, i: number): WordList | null {
  const src = `${band}-${i + 1}`;
  if (k.lists.some(l => l.src === src)) return null;
  const L: WordList = { id: uid(), name: `Gr ${BANDS[band]} Wk ${i + 1}: ${GRADE_LISTS[band][i][0]}`.slice(0, 40), created: Date.now(), test: '', src, words: gradeWords(band, i) };
  k.lists.push(L); k.cur = L.id; return L;
}
export function nextGradeWeek(k: Kid, band: Band): number {
  const have = new Set(k.lists.map(l => l.src));
  const i = GRADE_LISTS[band].findIndex((_, j) => !have.has(`${band}-${j + 1}`));
  return i < 0 ? 0 : i;
}

/* ---------- built-in sentences ---------- */
export function builtinSent(w: string, band: Band): string {
  const key = norm(w);
  for (const b of [band, '23', 'k1', '46'] as Band[]) {
    const m = BUILT_SENT[b]; if (!m) continue;
    for (const k in m) if (k.toLowerCase() === key) return m[k];
  }
  return '';
}
export function builtinMean(w: string): string {
  const key = norm(w);
  for (const k in BUILT_MEAN) if (k.toLowerCase() === key) return BUILT_MEAN[k];
  return '';
}
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Splits a sentence into text and blank parts; each blank keeps the hidden word's length. */
export function blankParts(sentence: string, word: string): { text?: string; blank?: number }[] {
  let re = new RegExp('(^|[^A-Za-z])(' + escRe(word) + ')(?![A-Za-z])', 'gi');
  if (!re.test(sentence)) re = new RegExp('()(' + escRe(word) + ')', 'gi');
  re.lastIndex = 0;
  const out: { text?: string; blank?: number }[] = []; let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(sentence))) {
    const st = m.index + m[1].length;
    if (st > last) out.push({ text: sentence.slice(last, st) });
    out.push({ blank: m[2].length }); last = st + m[2].length;
    if (re.lastIndex === m.index) re.lastIndex++;
  }
  if (last < sentence.length) out.push({ text: sentence.slice(last) });
  return out;
}

/* ---------- rounds ---------- */
export function yearMix(k: Kid, n: number): string[] {
  const t = upcomingTest(k), tw = new Set(t ? t.l.words.map(norm) : []), td = today();
  return allWords(k).map(w => {
    const key = norm(w), s = k.stats[key] || { c: 0, m: 0, s: 0, due: '' } as any;
    const weight = (s.m > 0 && s.s < 2 ? 3 : 0) + (s.c === 0 ? 1 : 0) + (tw.has(key) ? 2 : 0) + (s.due && s.due <= td ? 3 : 0) + Math.random() * 2.5;
    return { w, weight };
  }).sort((a, b) => b.weight - a.weight).slice(0, n).map(o => o.w);
}
export function roundWords(k: Kid, mode: Mode, listId?: string): string[] {
  if (mode === 'list') { const L = k.lists.find(l => l.id === listId) || k.lists.find(l => l.id === k.cur); return shuffle((L?.words || []).slice()); }
  if (mode === 'tricky') return shuffle(trickyWords(k));
  if (mode === 'due') return shuffle(dueWords(k));
  if (mode === 'all') return shuffle(allWords(k));
  return shuffle(yearMix(k, k.set.mix));
}
export const usesTiles = (k: Kid, style: Style) => style === 'unscramble' || k.set.input === 'tiles' || (k.set.input === 'auto' && k.set.grade === 'k1');

export function makePattern(w: string): string {
  const idx = [...w].map((c, i) => /[a-z]/i.test(c) ? i : -1).filter(i => i >= 0);
  const n = Math.max(1, Math.min(idx.length - 1, Math.round(idx.length * .35))) || 1;
  const hide = new Set(shuffle(idx.slice()).slice(0, n));
  return [...w].map((c, i) => hide.has(i) ? '_' : c).join('');
}
export function makeTiles(word: string, exact: boolean): string[] {
  const ch = [...word.toLowerCase()]; let pool = ch.slice();
  if (!exact) { const AB = 'abcdefghijklmnopqrstuvwxyz'; const n = ch.length <= 3 ? 2 : 3; for (let i = 0; i < n; i++) pool.push(AB[Math.floor(Math.random() * 26)]); }
  for (let t = 0; t < 12; t++) { pool = shuffle(pool); if (!exact || pool.join('') !== ch.join('') || new Set(ch).size < 2) break; }
  return pool;
}

/* ---------- checking an answer ---------- */
export interface CheckResult { correct: boolean; earned: number; reveal: boolean; triesLeft: number; caseOnly: boolean }
/**
 * Records one attempt. `firstTry` is true for the first attempt at this word in the round.
 * Updates stats, history, spaced-review box, tokens and spelled count on `k`.
 */
export function recordAttempt(k: Kid, word: string, guessRaw: string, tryIndex: number, caseSensitive: boolean): CheckResult {
  const raw = guessRaw.trim().replace(/[’‘]/g, "'");
  const guess = caseSensitive ? raw : norm(raw), ans = caseSensitive ? word.trim() : norm(word);
  const key = norm(word), first = tryIndex === 0;
  const st = k.stats[key] || (k.stats[key] = { c: 0, m: 0, s: 0, a: 0, f: 0, b: 0, due: '' });
  if (first) st.a++;
  const h = (k.hist[today()] ||= { c: 0, m: 0 });
  if (guess === ans) {
    st.c++;
    if (first) { st.s++; st.f++; st.b = Math.min(5, st.b + 1); st.due = addDays(BOX_DAYS[st.b]); }
    if (first) h.c++;
    const earned = first && k.set.firstBonus ? 2 : 1;
    k.tokens += earned; k.spelled++;
    return { correct: true, earned, reveal: false, triesLeft: 0, caseOnly: false };
  }
  if (first) { st.m++; st.s = 0; st.b = 0; st.due = today(); h.m++; }
  const triesLeft = k.set.tries - (tryIndex + 1);
  return { correct: false, earned: 0, reveal: triesLeft <= 0, triesLeft: Math.max(0, triesLeft), caseOnly: caseSensitive && norm(guess) === norm(ans) };
}
/** Stars for a finished round, based on first-try accuracy. */
export const roundStars = (firstRight: number, total: number) => { const r = total ? firstRight / total : 0; return r >= .9 ? 3 : r >= .7 ? 2 : 1; };
/** Per-letter feedback: 'ok' | 'bad' | 'miss'. */
export function letterMarks(guess: string, ans: string): { ch: string; mark: 'ok' | 'bad' | 'miss' }[] {
  const L = Math.max(guess.length, ans.length), out: { ch: string; mark: 'ok' | 'bad' | 'miss' }[] = [];
  for (let i = 0; i < L; i++) out.push(i >= guess.length ? { ch: '?', mark: 'miss' } : { ch: guess[i], mark: guess[i] === ans[i] ? 'ok' : 'bad' });
  return out;
}
export { allWords };
