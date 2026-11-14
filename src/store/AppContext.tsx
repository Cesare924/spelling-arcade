// App-wide state, saved on the device with AsyncStorage, plus the grown-up PIN and toasts.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeRoot, kidOf, type Root, type Kid } from '../logic/state.ts';

const KEY = 'spellingstars.v1';
const PREV_KEY = 'spellingstars.prev';
const UNLOCK_MS = 10 * 60 * 1000;

export type PinMode = 'check' | 'set';
export interface PinRequest { mode: PinMode; done: () => void; cancel?: () => void }

interface Ctx {
  ready: boolean;
  root: Root;
  kid: Kid;
  /** Change the active kid's data. The function gets a fresh copy to modify. */
  updateKid: (fn: (k: Kid) => void) => void;
  /** Change top-level data (profiles, PIN, etc.). */
  updateRoot: (fn: (r: Root) => void) => void;
  /** Replace everything (restore). Keeps the old data so the restore can be undone. */
  restore: (r: Root) => Promise<void>;
  undoRestore: () => Promise<boolean>;
  hasUndo: boolean;
  /** Runs `fn` now if there is no PIN or it was entered recently; otherwise asks for it first. */
  requirePin: (fn: () => void, onCancel?: () => void) => void;
  /** True when there is no PIN or it was entered in the last few minutes. */
  isUnlocked: () => boolean;
  /** Opens the PIN pad to choose a new PIN. */
  choosePin: (fn?: () => void) => void;
  pinRequest: PinRequest | null;
  closePin: (ok: boolean) => void;
  unlock: () => void;
  toast: (msg: string) => void;
  toastMsg: string;
}
const AppCtx = createContext<Ctx | null>(null);
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [root, setRoot] = useState<Root>(() => normalizeRoot(null));
  const [ready, setReady] = useState(false);
  const [hasUndo, setHasUndo] = useState(false);
  const [pinRequest, setPinRequestState] = useState<PinRequest | null>(null);
  const pinRef = useRef<PinRequest | null>(null);
  const setPinRequest = useCallback((p: PinRequest | null) => { pinRef.current = p; setPinRequestState(p); }, []);
  const [toastMsg, setToastMsg] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockedUntil = useRef(0);
  const rootRef = useRef(root); rootRef.current = root;

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(PREV_KEY)])
      .then(([raw, prev]) => { if (raw) setRoot(normalizeRoot(JSON.parse(raw))); setHasUndo(!!prev); })
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

  const restore = useCallback(async (r: Root) => {
    await AsyncStorage.setItem(PREV_KEY, JSON.stringify(rootRef.current)).catch(() => {});
    setHasUndo(true);
    const n = normalizeRoot(clone(r)); n.updatedAt = Date.now(); persist(n); setRoot(n);
  }, [persist]);
  const undoRestore = useCallback(async () => {
    const prev = await AsyncStorage.getItem(PREV_KEY).catch(() => null);
    if (!prev) return false;
    await AsyncStorage.removeItem(PREV_KEY).catch(() => {});
    setHasUndo(false);
    const n = normalizeRoot(JSON.parse(prev)); n.updatedAt = Date.now(); persist(n); setRoot(n);
    return true;
  }, [persist]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  }, []);

  const unlock = useCallback(() => { unlockedUntil.current = Date.now() + UNLOCK_MS; }, []);
  const isUnlocked = useCallback(() => !rootRef.current.pin || Date.now() < unlockedUntil.current, []);
  const requirePin = useCallback((fn: () => void, onCancel?: () => void) => {
    if (!rootRef.current.pin || Date.now() < unlockedUntil.current) { fn(); return; }
    setPinRequest({ mode: 'check', done: fn, cancel: onCancel });
  }, [setPinRequest]);
  const choosePin = useCallback((fn?: () => void) => setPinRequest({ mode: 'set', done: fn || (() => {}) }), [setPinRequest]);
  const closePin = useCallback((ok: boolean) => {
    const cur = pinRef.current; setPinRequest(null);
    if (ok && cur) setTimeout(cur.done, 0);
    else if (!ok && cur?.cancel) setTimeout(cur.cancel, 0);
  }, [setPinRequest]);

  return (
    <AppCtx.Provider value={{
      ready, root, kid: kidOf(root), updateKid, updateRoot, restore, undoRestore, hasUndo,
      requirePin, isUnlocked, choosePin, pinRequest, closePin, unlock, toast, toastMsg,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp must be inside AppProvider');
  return c;
}
