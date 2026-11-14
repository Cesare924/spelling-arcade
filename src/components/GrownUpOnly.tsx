// Guards grown-up screens. The home screen asks for the PIN before opening them, but a screen
// can also be reached another way (a link, the back stack after the PIN timed out), so each
// grown-up screen checks again itself and goes home if the PIN isn't entered.
import { useEffect, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { useApp } from '../store/AppContext.tsx';

export function GrownUpOnly({ children }: { children: ReactNode }) {
  const { ready, isUnlocked, requirePin } = useApp();
  const [ok, setOk] = useState(() => isUnlocked());
  useEffect(() => {
    if (!ready || ok) return;
    requirePin(() => setOk(true), () => { if (router.canGoBack()) router.back(); else router.replace('/'); });
  }, [ready]);
  return ok ? <>{children}</> : null;
}
