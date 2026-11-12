// App-wide state, saved on the device with AsyncStorage.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeRoot, kidOf, type Root, type Kid } from '../logic/state.ts';

const KEY = 'spellingstars.v1';

interface Ctx {
  ready: boolean;
  root: Root;
  kid: Kid;
  /** Change the active kid's data. The function gets a fresh copy to modify. */
  updateKid: (fn: (k: Kid) => void) => void;
  /** Change top-level data (profiles, PIN, etc.). */
  updateRoot: (fn: (r: Root) => void) => void;
  /** Replace everything (used by restore). */
  replaceRoot: (data: unknown) => void;
}
const AppCtx = createContext<Ctx | null>(null);

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [root, setRoot] = useState<Root>(() => normalizeRoot(null));
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => { if (raw) setRoot(normalizeRoot(JSON.parse(raw))); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((r: Root) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(r)).catch(() => {}); }, 250);
  }, []);

  const updateRoot = useCallback((fn: (r: Root) => void) => {
    setRoot(prev => { const r = clone(prev); fn(r); r.updatedAt = Date.now(); persist(r); return r; });
  }, [persist]);
  const updateKid = useCallback((fn: (k: Kid) => void) => updateRoot(r => fn(kidOf(r))), [updateRoot]);
  const replaceRoot = useCallback((data: unknown) => {
    const r = normalizeRoot(data); r.updatedAt = Date.now(); persist(r); setRoot(r);
  }, [persist]);

  return (
    <AppCtx.Provider value={{ ready, root, kid: kidOf(root), updateKid, updateRoot, replaceRoot }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp must be inside AppProvider');
  return c;
}
