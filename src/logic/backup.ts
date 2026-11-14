// Backup files: the same format as the web prototype, so files move both ways.
import { normalizeRoot, allWords, plural, type Root } from './state.ts';

export function backupText(r: Root): string {
  return JSON.stringify({ app: 'spelling-arcade', version: 2, savedAt: new Date().toISOString(), data: r });
}
/** Reads a backup (or bare saved data). Returns null if it isn't Spelling Arcade data. */
export function readBackup(text: string): { r: Root; savedAt: string | null } | null {
  let o: any;
  try { o = JSON.parse(String(text || '').trim()); } catch { return null; }
  if (!o || typeof o !== 'object') return null;
  const d = o.app === 'spelling-arcade' && o.data ? o.data : o;
  if (!d || typeof d !== 'object' || !(Array.isArray(d.profiles) || Array.isArray(d.lists) || Array.isArray(d.words))) return null;
  return { r: normalizeRoot(d), savedAt: typeof o.savedAt === 'string' ? o.savedAt : null };
}
export function backupSummary(r: Root): string {
  let words = 0; r.profiles.forEach(p => { words += allWords(r.P[p.id]).length; });
  return `${plural(r.profiles.length, 'kid')} (${r.profiles.map(p => p.avatar + ' ' + p.name).join(', ')}), ${plural(words, 'word')}`;
}
export function backupAge(lastBackup: number): { days: number | null; text: string; warn: boolean } {
  if (!lastBackup) return { days: null, text: "No backup yet. Save one so you don't lose words and progress.", warn: true };
  const days = Math.floor((Date.now() - lastBackup) / 864e5);
  const when = new Date(lastBackup).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return days >= 30 ? { days, text: `Last backup ${when} (${days} days ago). Time for a new one.`, warn: true } : { days, text: `Last backup: ${when}`, warn: false };
}
