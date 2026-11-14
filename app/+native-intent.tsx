// Links into the app from outside (spellingarcade://...) always open the home screen.
// Nothing in Spelling Arcade needs to be opened from a link, and this keeps links from
// jumping straight to grown-up screens or games.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (/^(spellingarcade:|exp\+spelling-arcade:)/i.test(path) || /^https?:/i.test(path)) return '/';
  } catch {}
  return path;
}
