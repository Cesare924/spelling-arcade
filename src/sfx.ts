// Short sound effects for practice (games make their own sounds).
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const SOURCES = {
  correct: require('../assets/sfx/correct.wav'),
  coin: require('../assets/sfx/coin.wav'),
  wrong: require('../assets/sfx/wrong.wav'),
  star: require('../assets/sfx/star.wav'),
  nope: require('../assets/sfx/nope.wav'),
  win: require('../assets/sfx/win.wav'),
};
export type Sfx = keyof typeof SOURCES;

const players: Partial<Record<Sfx, AudioPlayer>> = {};
let modeSet = false;

export function sfx(name: Sfx, on = true) {
  if (!on) return;
  try {
    if (!modeSet) { modeSet = true; setAudioModeAsync({ playsInSilentMode: true }).catch(() => {}); }
    const p = players[name] || (players[name] = createAudioPlayer(SOURCES[name]));
    p.seekTo(0); p.play();
  } catch { /* sound is optional */ }
}
