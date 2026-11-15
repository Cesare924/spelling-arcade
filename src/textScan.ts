// Reading text from photos needs a native add-on (expo-text-extractor). Some ways of running the
// app don't include it, like the free Expo Go app used for quick testing on an iPhone. Loading it
// here, inside try/catch, lets the rest of the app work there with scanning simply turned off.
type Extractor = { isSupported: boolean; extractTextFromImage: (uri: string) => Promise<string[]> };

let mod: Extractor | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mod = require('expo-text-extractor') as Extractor;
} catch {
  mod = null;
}

/** True when this phone and this build can read text from photos. */
export const isSupported: boolean = !!mod && !!mod.isSupported;

export async function extractTextFromImage(uri: string): Promise<string[]> {
  if (!mod) throw new Error('Scanning is not available in this version of the app.');
  return mod.extractTextFromImage(uri);
}
