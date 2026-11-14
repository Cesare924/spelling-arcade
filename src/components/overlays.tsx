// Pop-ups used across the app: grown-up PIN pad, toast message, kid picker, kid help.
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../store/AppContext.tsx';
import { Btn, H, P, Sheet, Field, Row, useLook } from './ui.tsx';
import { allWords, plural } from '../logic/state.ts';
import { say, stopSpeech } from '../speech.ts';
import { sfx } from '../sfx.ts';

/* ---------- PIN pad ---------- */
export function PinPad() {
  const { pinRequest, closePin, root, updateRoot, unlock, toast, kid } = useApp();
  const { c, f } = useLook();
  const [buf, setBuf] = useState('');
  const [step, setStep] = useState<'check' | 'set1' | 'set2'>('check');
  const [first, setFirst] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);
  const [forgot, setForgot] = useState<{ q: string; a: number } | null>(null);
  // Slows down guessing: after 5 wrong PINs, wait 30 seconds (then 60, 120...).
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (lockedUntil <= Date.now()) return; const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, [lockedUntil]);
  const lockLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const [ans, setAns] = useState('');

  useEffect(() => {
    if (!pinRequest) return;
    setBuf(''); setFirst(''); setErr(false); setForgot(null); setAns('');
    setStep(pinRequest.mode === 'check' ? 'check' : 'set1');
    setMsg(pinRequest.mode === 'check' ? 'Enter your PIN to continue.' : "Kids won't be able to change words or settings without it.");
  }, [pinRequest]);

  function done(code: string) {
    if (step === 'check') {
      if (code === root.pin) { setFails(0); unlock(); closePin(true); }
      else {
        const n = fails + 1; setFails(n); setBuf(''); setErr(true); sfx('nope', kid.set.sfx);
        if (n >= 5) { const wait = 30000 * Math.pow(2, Math.min(4, n - 5)); setLockedUntil(Date.now() + wait); setNow(Date.now()); setMsg(`Too many tries. Wait ${wait / 1000} seconds.`); }
        else setMsg("That's not it. Try again.");
      }
    } else if (step === 'set1') { setFirst(code); setBuf(''); setErr(false); setStep('set2'); setMsg('Enter the same PIN again to confirm.'); }
    else if (code === first) { updateRoot(r => { r.pin = code; }); unlock(); toast('PIN is set 🔒'); closePin(true); }
    else { setStep('set1'); setFirst(''); setBuf(''); setErr(true); setMsg("Those didn't match. Choose a PIN again."); }
  }
  function press(k: string) {
    if (k === 'x') { closePin(false); return; }
    if (k === 'b') { setBuf(b => b.slice(0, -1)); return; }
    if (buf.length >= 4 || (step === 'check' && lockLeft > 0)) return;
    const next = buf + k; setBuf(next); setErr(false);
    if (next.length === 4) done(next);
  }
  function askForgot() {
    const a = 12 + Math.floor(Math.random() * 8), b = 6 + Math.floor(Math.random() * 4);
    setForgot({ q: `Grown-up check: what is ${a} × ${b}?`, a: a * b }); setAns('');
  }
  function reset() {
    if (forgot && +ans === forgot.a) { updateRoot(r => { r.pin = ''; }); toast('PIN removed. You can set a new one in Settings.'); closePin(true); }
    else toast('Not quite. Try again.');
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', '0', 'b'];
  return (
    <Modal visible={!!pinRequest} transparent animationType="fade" onRequestClose={() => closePin(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,10,40,.6)', justifyContent: 'center', padding: 22 }}>
        <View style={{ backgroundColor: c.card, borderRadius: 22, padding: 20, gap: 12, alignItems: 'center' }}>
          <H>{step === 'check' ? 'Grown-ups only 🔒' : 'Choose a 4-digit PIN'}</H>
          <P style={{ textAlign: 'center', color: err ? c.bad : c.soft }}>{step === 'check' && lockLeft > 0 ? `Too many tries. Wait ${lockLeft} seconds.` : msg}</P>
          <View style={{ flexDirection: 'row', gap: 14, marginVertical: 4 }} accessibilityLabel={`${buf.length} of 4 digits entered`}>
            {[0, 1, 2, 3].map(i => <View key={i} style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: err ? c.bad : c.brand, backgroundColor: i < buf.length ? c.brand : 'transparent' }} />)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 252, gap: 12, justifyContent: 'center' }}>
            {keys.map(k => (
              <Pressable key={k} onPress={() => press(k)} accessibilityLabel={k === 'x' ? 'Cancel' : k === 'b' ? 'Delete' : k}
                style={({ pressed }) => ({ width: 72, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.line : c.brandSoft })}>
                <Text style={{ fontSize: (k === 'x' ? 15 : 24) * f, fontWeight: '800', color: c.brandDark }}>{k === 'x' ? 'Cancel' : k === 'b' ? '⌫' : k}</Text>
              </Pressable>
            ))}
          </View>
          {step === 'check' && !forgot && <Btn kind="ghost" small label="Forgot PIN?" onPress={askForgot} />}
          {forgot && (
            <View style={{ alignSelf: 'stretch', gap: 8 }}>
              <P>{forgot.q}</P>
              <Row><Field value={ans} onChangeText={setAns} keyboardType="number-pad" style={{ flex: 1 }} accessibilityLabel="Answer" />
                <Btn small label="Remove PIN" onPress={reset} /></Row>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ---------- toast ---------- */
export function Toast() {
  const { toastMsg } = useApp();
  if (!toastMsg) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: 48, alignItems: 'center' }}>
      <View style={{ backgroundColor: '#1e1b4b', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18, maxWidth: 420 }}>
        <Text accessibilityLiveRegion="polite" style={{ color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>{toastMsg}</Text>
      </View>
    </View>
  );
}

/* ---------- kid picker ---------- */
export function KidPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { root, updateRoot, toast, requirePin } = useApp();
  const { c, f } = useLook();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <H>Who's spelling?</H>
      {root.profiles.map(p => {
        const k = root.P[p.id], on = p.id === root.active;
        return (
          <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Switch to ${p.name}`}
            onPress={() => { updateRoot(r => { r.active = p.id; }); onClose(); toast(`Hi ${p.name}! ${p.avatar}`); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 2, borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandSoft : '#fff' }}>
            <Text style={{ fontSize: 36 }}>{p.avatar}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18 * f, fontWeight: '800', color: c.ink }}>{p.name}</Text>
              <Text style={{ color: c.soft, fontSize: 14 * f }}>🪙 {k.tokens} · {plural(allWords(k).length, 'word')}</Text>
            </View>
          </Pressable>
        );
      })}
      <Btn kind="secondary" label="Add or change kids" onPress={() => { onClose(); requirePin(() => router.push('/settings')); }} />
    </Sheet>
  );
}

/* ---------- kid help ---------- */
export function KidHelp({ visible, onClose, title, steps }: { visible: boolean; onClose: () => void; title: string; steps: [string, string][] }) {
  const { kid } = useApp();
  const { c, f } = useLook();
  return (
    <Sheet visible={visible} onClose={() => { stopSpeech(); onClose(); }}>
      <H>{title}</H>
      {steps.map(([em, t], i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900' }}>{i + 1}</Text>
          </View>
          <Text style={{ fontSize: 24 }}>{em}</Text>
          <Text style={{ flex: 1, fontSize: 16 * f, color: c.ink }}>{t}</Text>
        </View>
      ))}
      {kid.set.voice && <Btn kind="sky" label="🔊 Read it to me" onPress={() => say(steps.map(s => s[1].replace(/⌫/g, 'the back button')).join(' ... '), kid.set)} />}
      <Btn kind="secondary" label="Got it!" onPress={() => { stopSpeech(); onClose(); }} />
    </Sheet>
  );
}
