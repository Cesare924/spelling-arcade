// App data model. The JSON shape matches the Spelling Stars web prototype,
// so a backup saved from the prototype restores into this app unchanged.
import type { Band } from '../data/gradeLists.ts';

export type GameId =
  | 'derby' | 'race' | 'soccer' | 'hoops' | 'unicorn' | 'balloon' | 'catcher' | 'moonrocket'
  | 'scramble' | 'snake' | 'wheel' | 'detective' | 'memory' | 'icecream' | 'space' | 'bonk';
export const GAME_IDS: GameId[] = ['derby', 'race', 'soccer', 'hoops', 'unicorn', 'balloon', 'catcher', 'moonrocket',
  'scramble', 'snake', 'wheel', 'detective', 'memory', 'icecream', 'space', 'bonk'];

export interface Settings {
  voiceGender: 'any' | 'female' | 'male';
  voiceName: string;
  grade: Band;
  input: 'auto' | 'tiles' | 'keys';
  peek: 'on' | 'once' | 'off';
  tries: number;
  mix: number;
  rate: 'slow' | 'normal' | 'fast';
  twice: boolean;
  sentence: boolean;
  caps: boolean;
  firstBonus: boolean;
  cost: number;
  maxGames: number;
  maxMin: number;
  off: GameId[];
  diff: 'easy' | 'normal' | 'hard';
  sfx: boolean;
  voice: boolean;
  big: boolean;
  hc: boolean;
  calm: boolean;
}
export const DEFAULT_SET: Settings = {
  voiceGender: 'any', voiceName: '', grade: '23', input: 'auto', peek: 'on', tries: 2, mix: 15, rate: 'normal',
  twice: false, sentence: true, caps: false, firstBonus: false, cost: 1, maxGames: 0, maxMin: 0, off: [],
  diff: 'normal', sfx: true, voice: true, big: false, hc: false, calm: false,
};

export interface WordList { id: string; name: string; created: number; test: string; src: string; words: string[] }
export interface WordStat { c: number; m: number; s: number; a: number; f: number; b: number; due: string }
export interface Kid {
  lists: WordList[]; cur: string | null; stats: Record<string, WordStat>; hist: Record<string, { c: number; m: number }>;
  day: { date: string; games: number; ms: number }; stars: number; tokens: number; spelled: number;
  best: Record<string, number>; favs: GameId[]; set: Settings;
}
export interface Profile { id: string; name: string; avatar: string }
export interface Root {
  v: 2; profiles: Profile[]; active: string; pin: string; P: Record<string, Kid>;
  sent: Record<string, string>; defs: Record<string, string>; lastBackup: number; setupDone: boolean; updatedAt: number;
}

export const AVATARS = ['🦄', '🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐵', '🐙', '🦖', '🐧', '🐝', '🐯', '🐰'];

/* ---------- dates ---------- */
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pad2 = (n: number) => String(n).padStart(2, '0');
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const today = () => dateKey(new Date());
export const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return dateKey(d); };
export function parseDay(s?: string): Date | null {
  const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
export function daysUntil(s: string): number | null {
  const d = parseDay(s); if (!d) return null;
  return Math.round((d.getTime() - parseDay(today())!.getTime()) / 864e5);
}
export const weekName = () => 'Week of ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/* ---------- normalize (defensive load of saved or backed-up data) ---------- */
const strs = (a: unknown): string[] => Array.isArray(a) ? a.filter((w): w is string => typeof w === 'string').slice(0, 200) : [];
const isObj = (x: unknown): x is Record<string, any> => !!x && typeof x === 'object';

export function normSet(s: unknown, legacyMuted = false): Settings {
  const src = isObj(s) ? s : {};
  const o: Settings = JSON.parse(JSON.stringify(DEFAULT_SET));
  for (const k of Object.keys(DEFAULT_SET) as (keyof Settings)[]) {
    if (!(k in src)) continue;
    if (k === 'off') o.off = Array.isArray(src.off) ? src.off.filter((x: any) => GAME_IDS.includes(x)) : [];
    else if (typeof src[k] === typeof DEFAULT_SET[k]) (o as any)[k] = src[k];
  }
  if (legacyMuted && !('sfx' in src)) { o.sfx = false; o.voice = false; }
  return o;
}

export function normalizeKid(d: unknown): Kid {
  const x = isObj(d) ? d : {};
  let lists: WordList[] = Array.isArray(x.lists) ? x.lists.filter(isObj).slice(0, 80).map((l: any) => ({
    id: String(l.id || uid()), name: String(l.name || 'Word list').slice(0, 40), created: +l.created || 0,
    test: parseDay(l.test) ? l.test : '', src: typeof l.src === 'string' ? l.src.slice(0, 12) : '', words: strs(l.words),
  })) : [];
  if (!lists.length && strs(x.words).length) lists = [{ id: uid(), name: 'My first list', created: Date.now(), test: '', src: '', words: strs(x.words) }];
  const cur = lists.some(l => l.id === x.cur) ? x.cur : (lists.length ? lists[lists.length - 1].id : null);
  const stats: Record<string, WordStat> = {};
  if (isObj(x.stats)) for (const k in x.stats) { const s = x.stats[k]; if (isObj(s)) stats[k] = { c: +s.c || 0, m: +s.m || 0, s: +s.s || 0, a: +s.a || 0, f: +s.f || 0, b: +s.b || 0, due: parseDay(s.due) ? s.due : '' }; }
  const hist: Kid['hist'] = {};
  if (isObj(x.hist)) Object.keys(x.hist).filter(k => parseDay(k)).sort().slice(-90).forEach(k => { const h = x.hist[k] || {}; hist[k] = { c: +h.c || 0, m: +h.m || 0 }; });
  const day = isObj(x.day) && x.day.date === today() ? { date: today(), games: +x.day.games || 0, ms: +x.day.ms || 0 } : { date: today(), games: 0, ms: 0 };
  return {
    lists, cur, stats, hist, day,
    stars: Math.max(0, Math.floor(+x.stars || 0)),
    tokens: Math.max(0, Math.floor(+x.tokens || 0)),
    spelled: Math.max(0, Math.floor(+x.spelled || 0)),
    best: isObj(x.best) ? { ...x.best } : {},
    favs: Array.isArray(x.favs) ? x.favs.filter((g: any) => GAME_IDS.includes(g)) : [],
    set: normSet(x.set, !!x.muted),
  };
}

function strMap(x: unknown, max: number, len: number) {
  const out: Record<string, string> = {}; let n = 0;
  if (isObj(x)) for (const k in x) if (typeof x[k] === 'string' && n < max) { out[k] = x[k].slice(0, len); n++; }
  return out;
}

export function normalizeRoot(d: unknown): Root {
  const x = isObj(d) ? d : {};
  if (Array.isArray(x.profiles) && isObj(x.P)) {
    const profiles: Profile[] = x.profiles.filter((p: any) => p && p.id && x.P[p.id]).slice(0, 8)
      .map((p: any) => ({ id: String(p.id), name: String(p.name || 'Speller').slice(0, 20), avatar: AVATARS.includes(p.avatar) ? p.avatar : '🦄' }));
    if (profiles.length) {
      const P: Record<string, Kid> = {};
      profiles.forEach(p => { P[p.id] = normalizeKid(x.P[p.id]); });
      return {
        v: 2, profiles, active: profiles.some(p => p.id === x.active) ? x.active : profiles[0].id,
        pin: /^\d{4}$/.test(x.pin || '') ? x.pin : '', P, sent: strMap(x.sent, 400, 200), defs: strMap(x.defs, 400, 220),
        lastBackup: +x.lastBackup || 0, setupDone: !!x.setupDone, updatedAt: +x.updatedAt || 0,
      };
    }
  }
  const id = uid();
  return { v: 2, profiles: [{ id, name: 'Speller', avatar: '🦄' }], active: id, pin: '', P: { [id]: normalizeKid(x) },
    sent: {}, defs: {}, lastBackup: +x.lastBackup || 0, setupDone: !!x.setupDone, updatedAt: +x.updatedAt || 0 };
}

/* ---------- queries ---------- */
export const norm = (w: string) => String(w || '').trim().toLowerCase().replace(/[’‘]/g, "'");
export const kidOf = (r: Root): Kid => r.P[r.active];
export const profileOf = (r: Root): Profile => r.profiles.find(p => p.id === r.active) || r.profiles[0];
export const curList = (k: Kid) => k.lists.find(l => l.id === k.cur) || null;
export function allWords(k: Kid): string[] {
  const seen = new Set<string>(), out: string[] = [];
  for (const l of k.lists) for (const w of l.words) { const n = norm(w); if (!seen.has(n)) { seen.add(n); out.push(w); } }
  return out;
}
export const trickyWords = (k: Kid) => allWords(k).filter(w => { const s = k.stats[norm(w)]; return !!s && s.m > 0 && s.s < 2; });
export const dueWords = (k: Kid) => { const t = today(); return allWords(k).filter(w => { const s = k.stats[norm(w)]; return !!s && s.a > 0 && !!s.due && s.due <= t; }); };
export const isMastered = (s?: WordStat) => !!s && s.c > 0 && (s.m === 0 || s.s >= 2);
export function streak(k: Kid): number {
  const has = (key: string) => { const x = k.hist[key]; return !!x && x.c + x.m > 0; };
  const d = new Date();
  if (!has(dateKey(d))) { d.setDate(d.getDate() - 1); if (!has(dateKey(d))) return 0; }
  let n = 0; while (has(dateKey(d)) && n < 999) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export function upcomingTest(k: Kid) {
  return k.lists.filter(l => l.test && l.words.length).map(l => ({ l, d: daysUntil(l.test) }))
    .filter(o => o.d != null && o.d >= 0 && o.d <= 7).sort((a, b) => a.d! - b.d!)[0] || null;
}
export function whenText(d: number, s: string) {
  if (d === 0) return 'today'; if (d === 1) return 'tomorrow';
  return 'on ' + parseDay(s)!.toLocaleDateString('en-US', { weekday: 'long' });
}
export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

/* ---------- daily game limits ---------- */
/** Today's game record, reset when the date changes. */
export function dayRec(k: Kid) { if (k.day.date !== today()) k.day = { date: today(), games: 0, ms: 0 }; return k.day; }
export function limitReason(k: Kid): string {
  const d = k.day.date === today() ? k.day : { games: 0, ms: 0 };
  if (k.set.maxGames && d.games >= k.set.maxGames) return `That's all ${k.set.maxGames} games for today. Come back tomorrow! 🌙`;
  if (k.set.maxMin && d.ms >= k.set.maxMin * 60000) return `Play time is up for today (${k.set.maxMin} min). Come back tomorrow! 🌙`;
  return '';
}

/* ---------- kids ---------- */
export function addKid(r: Root): Profile | null {
  if (r.profiles.length >= 8) return null;
  const id = uid(), used = r.profiles.map(p => p.avatar);
  const p = { id, name: 'Kid ' + (r.profiles.length + 1), avatar: AVATARS.find(a => !used.includes(a)) || '🦄' };
  r.profiles.push(p); r.P[id] = normalizeKid({}); return p;
}
export function removeKid(r: Root, id: string) {
  if (r.profiles.length <= 1) return;
  r.profiles = r.profiles.filter(p => p.id !== id); delete r.P[id];
  if (r.active === id) r.active = r.profiles[0].id;
}
