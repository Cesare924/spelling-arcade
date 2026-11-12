// Turns text read from a photo of a spelling list into word suggestions.
import { cleanWord } from './practice.ts';
import { norm } from './state.ts';

// Words that usually label the paper rather than belong to the list.
const SKIP = new Set(['spelling', 'words', 'word', 'list', 'week', 'name', 'date', 'test', 'grade', 'unit', 'lesson',
  'bonus', 'challenge', 'review', 'homework', 'due', 'friday', 'monday', 'tuesday', 'wednesday', 'thursday', 'the', 'and', 'of', 'for']);

/** Pulls likely spelling words out of OCR lines, in reading order, without duplicates. */
export function wordsFromScan(lines: string[], have: string[] = []): string[] {
  const seen = new Set(have.map(norm)), out: string[] = [];
  for (const line of lines) {
    // Remove numbering like "1." or "12)" and split on spaces, commas, bullets.
    for (const raw of line.replace(/\b\d+[.)]/g, ' ').split(/[\s,;•·|]+/)) {
      const w = cleanWord(raw); if (!w || w.length < 2 && !/^[aAI]$/.test(w)) continue;
      const k = norm(w);
      if (SKIP.has(k) || seen.has(k)) continue;
      seen.add(k); out.push(/^[A-Z][a-z]/.test(w) && !/^I$/.test(w) ? w.toLowerCase() : w);
      if (out.length >= 60) return out;
    }
  }
  return out;
}
