# Spelling Stars (Expo app)

The phone-app version of Spelling Stars for Android and iOS, built with Expo and React Native.

## What's in the app
Everything from the web version:
- **Practice**: spell, unscramble, missing letters; tiles or keyboard; sentence and meaning buttons; peek; auto-advance; stars; spaced review; tricky words; test-date focus.
- **My Words**: weekly lists, rename, test dates, grade-level lists (30 weeks × 3 bands), quick-start lists, custom sentences, **camera scanning** read on the phone (ML Kit / Apple Vision).
- **Game Arcade**: all 16 games, favorites, best scores, token cost, daily game and time limits, hidden games, difficulty.
- **Grown-ups**: kid profiles, PIN (with forgot-PIN check), full settings, progress report, help + FAQ + fix-a-problem checks, first-run setup, backup/restore (file, clipboard, undo) compatible with web backups.
- **Comfort**: American male/female voices, speed, sound effects, bigger text, high contrast, calmer motion.

The games are the original canvas games, bundled with the app and run offline in a WebView
(`games-web/` → `npm run pack-games` → `src/games/gameHtml.ts`).

## Build for the Android emulator (Windows)
Keep the project in a short folder like `C:\ss` (Windows path limits). Start the emulator, then run
`.\build-android.bat` in a terminal in that folder. After a build, `.\start-android.bat` just starts the app server.

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
npm test          # app rules (20 tests)
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
