// Reading words aloud with the phone's built-in voices (expo-speech). Works offline.
import * as Speech from 'expo-speech';
import type { Settings } from './logic/state.ts';

export interface VoiceInfo { id: string; name: string; gender: 'female' | 'male' | 'unknown' }

const FEMALE = /samantha|allison|ava|susan|victoria|zoe|karen|nicky|female|joanna|salli|kendra|kimberly|ivy|sfg|tpf|tpc|iob|iog|\bf\d/i;
const MALE = /alex|fred|tom|aaron|evan|nathan|male|joey|justin|matthew|iom|tpd|sfb|\bm\d/i;

function guessGender(v: Speech.Voice): VoiceInfo['gender'] {
  const s = `${v.name} ${v.identifier}`;
  if (/female/i.test(s)) return 'female';
  if (/\bmale/i.test(s)) return 'male';
  if (FEMALE.test(s)) return 'female';
  if (MALE.test(s)) return 'male';
  return 'unknown';
}

let cache: VoiceInfo[] | null = null;
/** American English voices installed on this phone. */
export async function usVoices(): Promise<VoiceInfo[]> {
  if (cache) return cache;
  try {
    const all = await Speech.getAvailableVoicesAsync();
    cache = all.filter(v => /^en[-_]US/i.test(v.language))
      .map(v => ({ id: v.identifier, name: v.name.replace(/\s*\(.*\)$/, ''), gender: guessGender(v) }));
  } catch { cache = []; }
  return cache;
}

const RATES = { slow: 0.65, normal: 0.85, fast: 1.05 } as const;

async function pickVoice(set: Settings): Promise<string | undefined> {
  const vs = await usVoices();
  if (set.voiceName) { const v = vs.find(x => x.id === set.voiceName); if (v) return v.id; }
  if (set.voiceGender !== 'any') { const v = vs.find(x => x.gender === set.voiceGender); if (v) return v.id; }
  return vs[0]?.id;
}

export async function say(text: string, set: Settings, opts: { slower?: boolean; onDone?: () => void } = {}) {
  if (!set.voice) { opts.onDone?.(); return; }
  Speech.stop();
  const voice = await pickVoice(set);
  Speech.speak(text, {
    language: 'en-US', voice, rate: RATES[set.rate] * (opts.slower ? 0.7 : 1),
    onDone: opts.onDone, onStopped: opts.onDone, onError: () => opts.onDone?.(),
  });
}
/** Says the word, optionally twice, then the sentence if one is given. */
export async function sayWord(word: string, set: Settings, sentence?: string) {
  let text = word;
  if (set.twice) text += '. ' + word;
  if (sentence && set.sentence) text += '. ' + sentence + '. ' + word;
  return say(text, set);
}
export const stopSpeech = () => Speech.stop();
