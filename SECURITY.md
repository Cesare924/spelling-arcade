# Security & privacy notes

Last reviewed: November 14, 2026.

## Design
- **No accounts, servers, ads or analytics.** All data is stored on the device (AsyncStorage). Android cloud auto-backup is turned off (`allowBackup: false`) so kids' data stays on the device, matching the privacy policy.
- **Grown-up areas** (My Words, Settings, Help, Report, Scan, re-running setup) check the PIN on the screen itself, not only on the home screen, so they can't be reached around it.
- **PIN pad** locks for 30 seconds after 5 wrong tries (doubling each time). The PIN and "Forgot PIN" question are a parental gate to keep young children out, not strong security.
- **Links out of the app** (Buy Me a Coffee, privacy policy) are fixed addresses behind an always-on grown-up question.
- **Links into the app** (`spellingarcade://…`) always open the home screen (`app/+native-intent.tsx`).
- **Backups and saved data are untrusted input:** words, settings, numbers and keys are validated and limited; prototype-changing keys (`__proto__`, `constructor`, `prototype`) are ignored. See the "tampered backup" test.
- **Games** run in a WebView from a bundled page with a strict Content-Security-Policy (no network, no outside content). The WebView can't navigate away, open windows or read files. Messages from the game are type-checked and range-limited; the token cost always comes from the grown-up's setting.
- **Camera scanning** reads text on the device (ML Kit / Apple Vision); photos are not uploaded or stored by the app.

## Checks to run
- `npm test`: includes the tampered-backup test.
- **Security audit** task (`npm audit --omit=dev`): run after installing or updating packages.
- Before each store release, check the release build's permission list (`android/app/build/intermediates/merged_manifests/release/...`) and remove anything not needed.
