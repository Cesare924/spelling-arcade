// Prize Counter rules: earning and spending tickets, looks, saving goals, and family prize requests.
// Everything works on plain data so it can be tested without the app.
import { PRIZE_BY_ID, type LookSlot } from '../data/prizes.ts';
import { today, uid, type FamPrize, type FamReq, type Kid, type Root } from './state.ts';
import { MAX_PER_GAME } from './tickets.ts';

const DAY = 864e5;

/** Adds tickets won in a game (never more than one game can pay). */
export function awardTickets(k: Kid, n: number) {
  const t = Math.max(0, Math.min(MAX_PER_GAME, Math.floor(n) || 0));
  k.tickets += t; k.tix.earned += t;
  const d = today(); k.tday[d] = (k.tday[d] || 0) + t;
  const keys = Object.keys(k.tday).sort(); while (keys.length > 14) delete k.tday[keys.shift()!];
  return t;
}
/** Grown-up bonus or correction. Can be negative, never below zero. */
export function adjustTickets(k: Kid, n: number) {
  const before = k.tickets;
  k.tickets = Math.max(0, Math.min(1e6, k.tickets + Math.floor(n)));
  if (k.tickets > before) k.tix.earned += k.tickets - before;
}

/** Trade tickets for a Prize Counter prize. Returns an error message, or '' when it worked. */
export function buyPrize(k: Kid, id: string): string {
  const p = PRIZE_BY_ID[id];
  if (!p) return 'That prize is gone.';
  if (k.owned.includes(id)) return 'You already have this one.';
  if (k.tickets < p.price) return `You need ${p.price - k.tickets} more tickets.`;
  k.tickets -= p.price; k.tix.spent += p.price; k.owned.push(id);
  if (k.goal === id) k.goal = '';
  if (p.kind === 'look' && p.slot) setLook(k, id, true);
  return '';
}

/** Turn a game look on or off. Only one look per slot is on at a time. */
export function setLook(k: Kid, id: string, on: boolean) {
  const p = PRIZE_BY_ID[id];
  if (!p || p.kind !== 'look' || !k.owned.includes(id)) return;
  k.looksOn = k.looksOn.filter(x => x !== id && PRIZE_BY_ID[x]?.slot !== p.slot);
  if (on) k.looksOn.push(id);
}
/** The id of the look that is on in a slot, or ''. */
export function lookIn(k: Kid, slot: LookSlot): string {
  return k.looksOn.find(id => PRIZE_BY_ID[id]?.slot === slot && k.owned.includes(id)) || '';
}
/** Which looks are on, by slot, e.g. { hoops: true }. */
export function looksBySlot(k: Kid): Partial<Record<LookSlot, boolean>> {
  const out: Partial<Record<LookSlot, boolean>> = {};
  for (const id of k.looksOn) { const s = PRIZE_BY_ID[id]?.slot; if (s && k.owned.includes(id)) out[s] = true; }
  return out;
}

/* ---------- family prizes ---------- */
/** Family prizes this kid can see. */
export function famFor(r: Root, kidId: string): FamPrize[] {
  if (!r.fam.on) return [];
  return r.fam.prizes.filter(p => !p.kids.length || p.kids.includes(kidId));
}
/** Why this kid can't ask for this prize right now ('' if they can). */
export function famBlock(k: Kid, p: FamPrize, now = Date.now()): string {
  const mine = k.famReq.filter(q => q.pid === p.id);
  if (mine.some(q => q.st === 'wait')) return 'You already asked. Waiting for a grown-up.';
  const got = mine.filter(q => q.st === 'ok');
  if (p.freq === 'once' && got.length) return 'You already got this one.';
  const span = p.freq === 'week' ? 7 * DAY : p.freq === 'month' ? 30 * DAY : 0;
  if (span) {
    const last = Math.max(0, ...got.map(q => q.done || q.at));
    if (last && now - last < span) {
      const days = Math.max(1, Math.ceil((span - (now - last)) / DAY));
      return `You can pick this again in ${days} day${days === 1 ? '' : 's'}.`;
    }
  }
  if (k.tickets < p.price) return `You need ${p.price - k.tickets} more tickets.`;
  return '';
}
/** Ask for a family prize: its tickets are set aside until a grown-up answers. */
export function requestFam(k: Kid, p: FamPrize, now = Date.now()): string {
  const why = famBlock(k, p, now);
  if (why) return why;
  k.tickets -= p.price;
  k.famReq.push({ id: uid(), pid: p.id, name: p.name, em: p.em, price: p.price, at: now, st: 'wait', done: 0 });
  if (k.famReq.length > 40) k.famReq = [...k.famReq.filter(q => q.st === 'wait'), ...k.famReq.filter(q => q.st !== 'wait').slice(-30)];
  if (k.goal === 'fam:' + p.id) k.goal = '';
  return '';
}
/** A grown-up answers a request. "Not now" gives the tickets back. */
export function answerReq(k: Kid, reqId: string, ok: boolean, now = Date.now()) {
  const q = k.famReq.find(x => x.id === reqId);
  if (!q || q.st !== 'wait') return;
  q.st = ok ? 'ok' : 'no'; q.done = now;
  if (ok) k.tix.spent += q.price; else k.tickets += q.price;
}
/** All requests waiting for a grown-up, across kids, oldest first. */
export function waitingReqs(r: Root): { kidId: string; q: FamReq }[] {
  const out: { kidId: string; q: FamReq }[] = [];
  for (const p of r.profiles) for (const q of r.P[p.id]?.famReq || []) if (q.st === 'wait') out.push({ kidId: p.id, q });
  return out.sort((a, b) => a.q.at - b.q.at);
}
/** Tickets set aside in requests that are still waiting. */
export const setAside = (k: Kid) => k.famReq.filter(q => q.st === 'wait').reduce((a, q) => a + q.price, 0);

/** The prize a kid is saving for, if any. */
export function goalOf(r: Root, k: Kid, kidId: string): { em: string; name: string; price: number } | null {
  if (!k.goal) return null;
  if (k.goal.startsWith('fam:')) {
    const p = famFor(r, kidId).find(x => x.id === k.goal.slice(4));
    return p ? { em: p.em, name: p.name, price: p.price } : null;
  }
  const p = PRIZE_BY_ID[k.goal];
  return p && !k.owned.includes(p.id) ? { em: p.em, name: p.name, price: p.price } : null;
}

/** Average tickets won on the days this kid played, over the last two weeks (a grown-up's price hint). */
export function ticketsPerDay(k: Kid): number {
  const v = Object.values(k.tday).filter(n => n > 0);
  return v.length ? Math.round(v.reduce((a, n) => a + n, 0) / v.length) : 0;
}
