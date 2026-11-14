// How many tickets a finished game pays. Each game scores differently, so each has its own
// bronze / silver / gold score levels; that keeps every game equally worth playing.
import type { GameId } from './state.ts';

/** [bronze, silver, gold] score levels for each game. */
export const LEVELS: Record<GameId, [number, number, number]> = {
  derby: [3, 8, 15], race: [60, 110, 170], soccer: [6, 12, 20], hoops: [6, 14, 24], fieldgoal: [3, 9, 18],
  hockey: [10, 18, 28], bowling: [40, 70, 100], minigolf: [6, 10, 14], tennis: [4, 15, 40],
  unicorn: [200, 450, 800], dino: [60, 140, 250], puppy: [3, 9, 18], balloon: [40, 100, 180],
  catcher: [8, 16, 26], moonrocket: [30, 80, 130], scramble: [30, 120, 240], snake: [3, 8, 15],
  wheel: [5, 12, 20], detective: [40, 150, 350], fishing: [10, 40, 90], beehive: [15, 80, 180],
  train: [20, 60, 100], wordbowl: [30, 70, 110], memory: [40, 80, 110], icecream: [4, 10, 18],
  space: [8, 16, 26], bonk: [40, 100, 150],
};
export const PAY = { played: 1, bronze: 3, silver: 5, gold: 8, newBest: 4, jackpot: 25 };
/** Chance of a jackpot on a silver or gold game. */
export const JACKPOT_CHANCE = 0.08;
/** The most one game can ever pay (gold + new best + jackpot). */
export const MAX_PER_GAME = PAY.gold + PAY.newBest + PAY.jackpot;

export type Level = 'played' | 'bronze' | 'silver' | 'gold';
export interface Payout { level: Level; base: number; newBest: number; jackpot: number; total: number; next: number | null }

/**
 * Tickets for one game.
 * @param prevBest the kid's best before this game (undefined if first time)
 * @param roll a random number 0..1 (passed in so results are testable)
 */
export function payout(id: GameId, score: number, prevBest: number | undefined, roll: number): Payout {
  const [b, s, g] = LEVELS[id] || [1, 2, 3];
  const sc = Math.max(0, Math.floor(score) || 0);
  const level: Level = sc >= g ? 'gold' : sc >= s ? 'silver' : sc >= b ? 'bronze' : 'played';
  const base = PAY[level];
  // A new best only counts when there was a real best to beat.
  const newBest = prevBest != null && prevBest > 0 && sc > prevBest ? PAY.newBest : 0;
  const jackpot = (level === 'silver' || level === 'gold') && roll < JACKPOT_CHANCE ? PAY.jackpot : 0;
  const next = level === 'gold' ? null : level === 'silver' ? g : level === 'bronze' ? s : b;
  return { level, base, newBest, jackpot, total: base + newBest + jackpot, next };
}
export const LEVEL_LABEL: Record<Level, string> = { played: 'Thanks for playing', bronze: 'Bronze score', silver: 'Silver score', gold: 'Gold score' };
