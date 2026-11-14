// Links into the app from outside (spellingstars://...) always open the home screen.
// Nothing in Spelling Stars needs to be opened from a link, and this keeps links from
// jumping straight to grown-up screens or games.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (/^(spellingstars:|exp\+spelling-stars:)/i.test(path) || /^https?:/i.test(path)) return '/';
  } catch {}
  return path;
}
