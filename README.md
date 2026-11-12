# Spelling Stars (Expo app)

The phone-app version of Spelling Stars for Android and iOS, built with Expo and React Native.

## Stage 1 — what's here
- **Home**: tokens, stars, day streak, upcoming test banner, review-due button.
- **Practice**: hear & spell (with example sentences, blanks sized to the word), missing letters, unscramble; letter tiles or keyboard; tries, peek, auto-advance on a correct answer, stars per round.
- **My Words**: weekly lists, whole-year practice, 30 grade-level weeks per grade band, test dates.
- **Settings**: grade, American male/female voice, speed, input style, tries, mix size, sentences, capitals, bonus tokens, sound.
- **Spaced review** and **tricky words**, same rules as the web prototype.
- Saved on the phone (AsyncStorage) in the **same format as the web prototype**, so prototype backups will restore once backup is added.
- Arcade screen lists the 16 games as "coming soon".

Coming in later stages: the 16 games, kid profiles, grown-up PIN, progress report, help, first-run setup, backup/restore, camera scanning (on-device text recognition).

## Run it on your phone (no Mac needed)
1. Install **Node.js LTS** (nodejs.org) and **Git**.
2. Install **Expo Go** on your phone (Play Store / App Store).
3. In this folder:
   ```
   npm install
   npx expo install --fix      # lines up package versions with the Expo SDK
   npx expo start
   ```
4. Scan the QR code with Expo Go (Android) or the Camera app (iPhone).

## Checks
```
npm test          # practice rules (16 tests)
npm run typecheck
```

## Building for the stores (later)
```
npm install -g eas-cli
eas login
eas build --platform android   # Play Store .aab
eas build --platform ios       # App Store build, made in the cloud — no Mac required
eas submit --platform ios
```
You'll need a Google Play developer account ($25 once) and an Apple Developer account ($99/year).

## Layout
```
app/                 screens (Expo Router: file name = screen)
  _layout.tsx        navigation + saved-data provider
  index.tsx          Home
  practice/          chooser + spelling session
  words.tsx  settings.tsx  arcade.tsx
src/data/            grade lists, built-in sentences and meanings
src/logic/           app rules (no React — tested with plain Node)
src/store/           saved data (AsyncStorage)
src/speech.ts        read-aloud (expo-speech, on-device voices)
tests/               logic tests
```
