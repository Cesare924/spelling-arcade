// Builds the app's small sound effects as WAV files (same tones as the web version).
//   node scripts/make-sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sfx');
mkdirSync(out, { recursive: true });

const wave = {
  sine: p => Math.sin(2 * Math.PI * p),
  triangle: p => 1 - 4 * Math.abs(Math.round(p) - p),
  square: p => (p % 1 < .5 ? 1 : -1),
  sawtooth: p => 2 * (p % 1) - 1,
};
function render(tones, total) {
  const buf = new Float32Array(Math.ceil(total * RATE));
  for (const [f, d, type = 'sine', vol = .12, when = 0, slide] of tones) {
    const start = Math.floor(when * RATE), n = Math.floor(d * RATE); let ph = 0;
    for (let i = 0; i < n && start + i < buf.length; i++) {
      const t = i / n, freq = slide ? f * Math.pow(slide / f, t) : f;
      ph += freq / RATE;
      const env = vol * Math.pow(.0008 / vol, t) * Math.min(1, i / 40); // exponential fade like the web version
      buf[start + i] += wave[type](ph) * env;
    }
  }
  return buf;
}
function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.max(-1, Math.min(1, s * 2.2)) * 32767 | 0, i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}
const SOUNDS = {
  correct: [[[523, .13, 'triangle', .14], [659, .13, 'triangle', .14, .1], [784, .25, 'triangle', .14, .2]], .5],
  coin: [[[988, .08, 'square', .06], [1319, .3, 'square', .06, .08]], .42],
  wrong: [[[240, .3, 'sawtooth', .06, 0, 150]], .35],
  star: [[[1150, .12, 'sine', .1, 0, 1900]], .16],
  nope: [[[210, .15, 'triangle', .1]], .2],
  win: [[523, 659, 784, 1047].map((f, i) => [f, .2, 'triangle', .12, i * .09]), .5],
};
for (const [name, [tones, len]] of Object.entries(SOUNDS)) writeFileSync(join(out, name + '.wav'), wav(render(tones, len)));
console.log('Made', Object.keys(SOUNDS).length, 'sounds in assets/sfx');
