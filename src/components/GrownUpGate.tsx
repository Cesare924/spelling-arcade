// Grown-up check before anything leaves the app (links to websites).
// Always on, even when the PIN is turned off, as app stores require for kids' apps.
import { useEffect, useState } from 'react';
import { Linking, Modal, Text, View } from 'react-native';
import { useApp } from '../store/AppContext.tsx';
import { Btn, H, P, Field, Row, useLook } from './ui.tsx';

function question() {
  const a = 11 + Math.floor(Math.random() * 9), b = 6 + Math.floor(Math.random() * 4);
  return { text: `What is ${a} × ${b}?`, answer: a * b };
}

export function GrownUpGate({ url, onClose }: { url: string | null; onClose: () => void }) {
  const { toast } = useApp();
  const { c } = useLook();
  const [q, setQ] = useState(question);
  const [ans, setAns] = useState('');
  const [wrong, setWrong] = useState(0);
  useEffect(() => { if (url) { setQ(question()); setAns(''); setWrong(0); } }, [url]);

  async function check() {
    if (+ans.trim() !== q.answer) {
      const n = wrong + 1; setWrong(n); setAns('');
      if (n >= 3) { toast('Ask a grown-up for help 🙂'); onClose(); return; }
      setQ(question()); return;
    }
    const target = url; onClose();
    try { if (target) await Linking.openURL(target); } catch { toast("Couldn't open the browser"); }
  }

  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,10,40,.6)', justifyContent: 'center', padding: 22 }}>
        <View style={{ backgroundColor: c.card, borderRadius: 22, padding: 20, gap: 12 }}>
          <H>Grown-ups only 🔒</H>
          <P>This opens a website outside the app. Please answer to continue.</P>
          <Text style={{ fontSize: 24, fontWeight: '900', color: c.ink, textAlign: 'center' }}>{q.text}</Text>
          <Field value={ans} onChangeText={setAns} keyboardType="number-pad" placeholder="Answer" onSubmitEditing={check}
            accessibilityLabel="Answer" style={{ textAlign: 'center', fontSize: 22 }} autoFocus />
          {wrong > 0 && <P small style={{ color: c.bad }}>Not quite. Here's a new one.</P>}
          <Row>
            <Btn kind="ghost" label="Cancel" onPress={onClose} style={{ flex: 1 }} />
            <Btn label="Continue" onPress={check} disabled={!ans.trim()} style={{ flex: 1 }} />
          </Row>
        </View>
      </View>
    </Modal>
  );
}
