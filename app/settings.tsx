import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useApp } from '../src/store/AppContext.tsx';
import { Screen, Card, H, P, Chips, Btn, C } from '../src/components/ui.tsx';
import type { Settings } from '../src/logic/state.ts';
import type { Band } from '../src/data/gradeLists.ts';
import { usVoices, say, type VoiceInfo } from '../src/speech.ts';

export default function SettingsScreen() {
  const { kid, updateKid } = useApp();
  const s = kid.set;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => updateKid(x => { x.set[k] = v; });
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  useEffect(() => { usVoices().then(setVoices); }, []);
  const shown = voices.filter(v => s.voiceGender === 'any' || v.gender === s.voiceGender);

  return (
    <Screen>
      <Card>
        <H>Grade</H>
        <Chips<Band> value={s.grade} onChange={v => set('grade', v)} options={[
          { v: 'k1', label: 'K–1' }, { v: '23', label: '2–3' }, { v: '46', label: '4–6' }]} />
      </Card>

      <Card>
        <H>Voice (American English)</H>
        <Chips value={s.voiceGender} onChange={v => { set('voiceGender', v); set('voiceName', ''); }} options={[
          { v: 'any', label: 'Any' }, { v: 'female', label: 'Female' }, { v: 'male', label: 'Male' }]} />
        {shown.length > 0
          ? <Chips value={s.voiceName} onChange={v => set('voiceName', v)}
              options={[{ v: '', label: 'Automatic' }, ...shown.slice(0, 12).map(v => ({ v: v.id, label: v.name }))]} />
          : <P style={{ fontSize: 14 }}>No {s.voiceGender === 'any' ? '' : s.voiceGender + ' '}US voices found on this phone. Add one in the phone's text-to-speech settings.</P>}
        <P>Speed</P>
        <Chips value={s.rate} onChange={v => set('rate', v)} options={[
          { v: 'slow', label: 'Slow' }, { v: 'normal', label: 'Normal' }, { v: 'fast', label: 'Fast' }]} />
        <Btn kind="secondary" label="🔊 Test voice" onPress={() => say('Let\'s spell. Rainbow.', s)} />
      </Card>

      <Card>
        <H>Practice</H>
        <P>Answer with</P>
        <Chips value={s.input} onChange={v => set('input', v)} options={[
          { v: 'auto', label: 'Auto' }, { v: 'tiles', label: 'Letter tiles' }, { v: 'keys', label: 'Keyboard' }]} />
        <P>Peek at the word</P>
        <Chips value={s.peek} onChange={v => set('peek', v)} options={[
          { v: 'on', label: 'Allowed' }, { v: 'once', label: 'Once per word' }, { v: 'off', label: 'Off' }]} />
        <P>Tries per word</P>
        <Chips value={s.tries} onChange={v => set('tries', v)} options={[1, 2, 3].map(n => ({ v: n, label: String(n) }))} />
        <P>Words in a year mix</P>
        <Chips value={s.mix} onChange={v => set('mix', v)} options={[10, 15, 20, 30].map(n => ({ v: n, label: String(n) }))} />
        <Toggle label="Say each word twice" value={s.twice} onChange={v => set('twice', v)} />
        <Toggle label="Use example sentences" value={s.sentence} onChange={v => set('sentence', v)} />
        <Toggle label="Capital letters count" value={s.caps} onChange={v => set('caps', v)} />
        <Toggle label="Bonus token on first try" value={s.firstBonus} onChange={v => set('firstBonus', v)} />
      </Card>

      <Card>
        <H>Sound</H>
        <Toggle label="Read words aloud" value={s.voice} onChange={v => set('voice', v)} />
        <Toggle label="Sound effects" value={s.sfx} onChange={v => set('sfx', v)} />
      </Card>
      <P style={{ fontSize: 13, textAlign: 'center' }}>Game limits, profiles, PIN and backup arrive in the next stage.</P>
    </Screen>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: 16, color: C.ink, fontWeight: '600', flex: 1 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.brand, false: '#d1d5db' }} accessibilityLabel={label} />
    </View>
  );
}
