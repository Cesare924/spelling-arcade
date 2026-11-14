import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../src/store/AppContext.tsx';
import { GrownUpOnly } from '../src/components/GrownUpOnly.tsx';
import { Screen, Card, H, P, Chips, Btn, Row, Field, Toggle, useLook } from '../src/components/ui.tsx';
import { AVATARS, GAME_IDS, addKid, removeKid, plural, today, type Settings, type GameId, type Root } from '../src/logic/state.ts';
import { backupText, readBackup, backupSummary, backupAge } from '../src/logic/backup.ts';
import type { Band } from '../src/data/gradeLists.ts';
import { GAMES } from '../src/games/meta.ts';
import { usVoices, say, type VoiceInfo } from '../src/speech.ts';
import { sfx } from '../src/sfx.ts';
import { shareBackupFile, copyBackup, pickBackupFile, pasteText } from '../src/backupIO.ts';
import { GrownUpGate } from '../src/components/GrownUpGate.tsx';
import { APP_VERSION, SHOW_SUPPORT_LINK, SUPPORT_URL, PRIVACY_URL } from '../src/config.ts';

function SettingsScreenInner() {
  const { root, kid, updateKid, updateRoot, choosePin, toast, restore, undoRestore, hasUndo } = useApp();
  const { c, f } = useLook();
  const s = kid.set;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => updateKid(x => { x.set[k] = v; });
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [pending, setPending] = useState<{ r: Root; savedAt: string | null } | null>(null);
  const [pasteBox, setPasteBox] = useState(false);
  const [pasteVal, setPasteVal] = useState('');
  const [gateUrl, setGateUrl] = useState<string | null>(null);
  useEffect(() => { usVoices().then(setVoices); }, []);
  const me = root.profiles.find(p => p.id === root.active)!;
  const day = kid.day.date === today() ? kid.day : { games: 0, ms: 0 };
  const nF = voices.filter(v => v.gender === 'female').length, nM = voices.filter(v => v.gender === 'male').length;
  const shown = voices.filter(v => s.voiceGender === 'any' || v.gender === s.voiceGender);
  const age = backupAge(root.lastBackup);

  const confirm = (title: string, msg: string, ok: () => void, okLabel = 'Yes') =>
    Alert.alert(title, msg, [{ text: 'Cancel', style: 'cancel' }, { text: okLabel, style: 'destructive', onPress: ok }]);
  const testVoice = () => { if (!s.voice) { toast('Spoken words are off. Turn them on below.'); return; } say("Hi! Let's spell. Cat.", s); };

  async function saveFile() {
    try { const ok = await shareBackupFile(backupText(root)); if (ok) { updateRoot(r => { r.lastBackup = Date.now(); }); toast('Backup ready to save 💾'); } else toast("Sharing isn't available. Use Copy backup."); }
    catch { toast("Couldn't make the backup file. Use Copy backup."); }
  }
  async function copy() {
    try { await copyBackup(backupText(root)); updateRoot(r => { r.lastBackup = Date.now(); }); toast('Backup copied. Paste it into a note or email to keep it 📋'); }
    catch { toast("Couldn't copy here. Try Save backup file."); }
  }
  function offer(text: string) {
    const b = readBackup(text);
    if (!b) { toast("That isn't a Spelling Stars backup"); return; }
    setPending(b); setPasteBox(false);
  }
  async function fromFile() {
    try { const t = await pickBackupFile(); if (t != null) offer(t); }
    catch { toast("Couldn't read that file"); }
  }

  return (
    <Screen>
      <Btn kind="secondary" label="❓ Help, FAQ & fix a problem" onPress={() => router.push('/help')} />

      <Card>
        <H>👧 Kids</H>
        <P small>Each kid has their own words, tokens, progress and settings. Tap a picture to change it.</P>
        {root.profiles.map(p => (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable accessibilityLabel={`Change ${p.name}'s picture`} onPress={() => updateRoot(r => { const x = r.profiles.find(q => q.id === p.id)!; x.avatar = AVATARS[(AVATARS.indexOf(x.avatar) + 1) % AVATARS.length]; })}
              style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 30 }}>{p.avatar}</Text>
            </Pressable>
            <Field defaultValue={p.name} maxLength={20} onEndEditing={e => { const v = e.nativeEvent.text.trim() || 'Speller'; updateRoot(r => { r.profiles.find(q => q.id === p.id)!.name = v.slice(0, 20); }); }}
              style={{ flex: 1, paddingVertical: 8 }} accessibilityLabel="Name" />
            {p.id === root.active
              ? <Btn small kind="good" label="Playing" onPress={() => {}} />
              : <Btn small kind="secondary" label="Switch" onPress={() => { updateRoot(r => { r.active = p.id; }); toast('Now playing: ' + p.name); }} />}
            {root.profiles.length > 1 && <Btn small kind="ghost" label="✕" onPress={() => confirm(`Remove ${p.name}?`, 'Their words, tokens and progress will be deleted.', () => { updateRoot(r => removeKid(r, p.id)); toast('Removed'); }, 'Remove')} />}
          </View>
        ))}
        {root.profiles.length < 8 && <Btn kind="secondary" label="＋ Add a kid" onPress={() => { updateRoot(r => { addKid(r); }); toast('Added. Type their name above ✏️'); }} />}
      </Card>

      <View style={{ backgroundColor: c.brandSoft, borderRadius: 12, padding: 10 }}>
        <Text style={{ textAlign: 'center', color: c.brandDark, fontSize: 15 * f }}>The settings below are for <Text style={{ fontWeight: '900' }}>{me.avatar} {me.name}</Text></Text>
      </View>

      <Card>
        <H>✏️ Practice</H>
        <Chips<Band> label="🎒 Grade band" help="Sets letter tiles for K–1 and the 📖 Meaning button for 4–6" value={s.grade} onChange={v => set('grade', v)}
          options={[{ v: 'k1', label: 'K–1' }, { v: '23', label: '2–3' }, { v: '46', label: '4–6' }]} />
        <Chips label="How to spell" help="Auto uses letter tiles for K–1 and the keyboard for older kids" value={s.input} onChange={v => set('input', v)}
          options={[{ v: 'auto', label: 'Auto' }, { v: 'tiles', label: 'Letter tiles' }, { v: 'keys', label: 'Keyboard' }]} />
        <Chips label="👀 Peek button" value={s.peek} onChange={v => set('peek', v)} options={[{ v: 'on', label: 'Any time' }, { v: 'once', label: 'Once a word' }, { v: 'off', label: 'Off' }]} />
        <Chips label="Tries before showing the answer" value={s.tries} onChange={v => set('tries', v)} options={[1, 2, 3].map(n => ({ v: n, label: String(n) }))} />
        <Chips label="Whole-year mix length" help="Words per round" value={s.mix} onChange={v => set('mix', v)} options={[5, 10, 15, 20].map(n => ({ v: n, label: String(n) }))} />
        <Chips label="Speaking speed" value={s.rate} onChange={v => set('rate', v)} options={[{ v: 'slow', label: '🐢 Slow' }, { v: 'normal', label: 'Normal' }, { v: 'fast', label: '🐇 Fast' }]} />
        <Chips label="🗣️ Voice" help="American English voices from this phone" value={s.voiceGender}
          onChange={v => { updateKid(x => { x.set.voiceGender = v; x.set.voiceName = ''; }); setTimeout(testVoice, 100); }}
          options={[{ v: 'any', label: 'Any' }, { v: 'female', label: '👩 Female' }, { v: 'male', label: '👨 Male' }]} />
        {shown.length > 0 && <Chips value={s.voiceName} onChange={v => { set('voiceName', v); setTimeout(testVoice, 100); }}
          options={[{ v: '', label: 'Pick automatically' }, ...shown.slice(0, 14).map(v => ({ v: v.id, label: (v.gender === 'female' ? '👩 ' : v.gender === 'male' ? '👨 ' : '') + v.name }))]} />}
        <P small>{voices.length
          ? `${plural(voices.length, 'American English voice')} on this phone (${nF} female, ${nM} male).` + (s.voiceGender !== 'any' && !(s.voiceGender === 'female' ? nF : nM) ? ` No ${s.voiceGender} voice was found, so the default voice is used. You can add voices in the phone's settings.` : '')
          : 'No American English voices found yet. On Android: Settings › Text-to-speech › install English (United States). On iPhone: Settings › Accessibility › Spoken Content › Voices › English (US).'}</P>
        <Btn kind="secondary" small label="▶ Test voice" onPress={testVoice} />
        <Toggle label="Say each word twice" value={s.twice} onChange={v => set('twice', v)} />
        <Toggle label="💬 Sentence button" help="Reads a short sentence that uses the word" value={s.sentence} onChange={v => set('sentence', v)} />
        <Toggle label="Capital letters must match" help='For names and words like "I"' value={s.caps} onChange={v => set('caps', v)} />
      </Card>

      <Card>
        <H>🪙 Tokens & games</H>
        <Chips label="Tokens per correct word" value={s.firstBonus} onChange={v => set('firstBonus', v)} options={[{ v: false, label: '1 token' }, { v: true, label: '2 on first try' }]} />
        <Chips label="Cost to play a game" value={s.cost} onChange={v => set('cost', v)} options={[1, 2, 3].map(n => ({ v: n, label: `${n} 🪙` }))} />
        <Chips label="Games per day" value={s.maxGames} onChange={v => set('maxGames', v)} options={[{ v: 0, label: 'No limit' }, { v: 3, label: '3' }, { v: 5, label: '5' }, { v: 10, label: '10' }]} />
        <Chips label="Play time per day" value={s.maxMin} onChange={v => set('maxMin', v)} options={[{ v: 0, label: 'No limit' }, { v: 10, label: '10 min' }, { v: 15, label: '15 min' }, { v: 30, label: '30 min' }]} />
        <P small>Today: {plural(day.games, 'game')}, {Math.round(day.ms / 60000)} min played.</P>
        <Chips label="Game difficulty" value={s.diff} onChange={v => set('diff', v)} options={[{ v: 'easy', label: 'Easy' }, { v: 'normal', label: 'Normal' }, { v: 'hard', label: 'Hard' }]} />
        <Text style={{ fontSize: 16 * f, color: c.ink, fontWeight: '700' }}>Games to show</Text>
        <P small>Tap a game to hide or show it</P>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GAME_IDS.map((id: GameId) => {
            const off = s.off.includes(id);
            return (
              <Pressable key={id} accessibilityRole="switch" accessibilityState={{ checked: !off }} accessibilityLabel={GAMES[id].title}
                onPress={() => updateKid(k => { k.set.off = off ? k.set.off.filter(x => x !== id) : [...k.set.off, id]; })}
                style={{ width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 12, borderWidth: 2, borderColor: off ? '#d4d4d8' : c.good, backgroundColor: off ? '#f4f4f5' : c.goodBg }}>
                <Text style={{ fontSize: 20, opacity: off ? .4 : 1 }}>{GAMES[id].em}</Text>
                <Text style={{ flex: 1, fontSize: 14 * f, fontWeight: '800', color: off ? '#52525b' : c.ink }}>{GAMES[id].title}</Text>
                <Text style={{ fontSize: 12 * f, fontWeight: '800', color: off ? '#52525b' : c.good }}>{off ? 'Hidden' : 'On'}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <H>🔒 Grown-up tools</H>
        <Text style={{ fontSize: 16 * f, color: c.ink, fontWeight: '700' }}>Grown-up PIN</Text>
        <P small>{root.pin ? 'On. My Words, Settings, Help and the report need the PIN.' : 'Off. Anyone can change words, tokens and settings.'}</P>
        <Row>
          <Btn small label={root.pin ? 'Change PIN' : 'Set a PIN'} onPress={() => choosePin()} />
          {!!root.pin && <Btn small kind="ghost" label="Turn off PIN" onPress={() => confirm('Turn off the PIN?', 'Anyone will be able to change words and settings.', () => { updateRoot(r => { r.pin = ''; }); toast('PIN turned off'); }, 'Turn off')} />}
        </Row>
        <Text style={{ fontSize: 16 * f, color: c.ink, fontWeight: '700' }}>Bonus tokens</Text>
        <P small>{me.name} has {plural(kid.tokens, 'token')}</P>
        <Row>{[-1, 1, 5, 10].map(n => <Btn key={n} small kind={n < 0 ? 'ghost' : 'primary'} label={n < 0 ? '−1' : `+${n}`} onPress={() => { updateKid(k => { k.tokens = Math.max(0, k.tokens + n); }); if (n > 0) sfx('coin', s.sfx); }} />)}</Row>

        <Text style={{ fontSize: 16 * f, color: c.ink, fontWeight: '700' }}>💾 Backup & restore</Text>
        <P small>Saves every kid's word lists, progress, tokens and settings in one file. Keep it somewhere safe, like your email or Google Drive. Backups from the web version work here too.</P>
        <Text style={{ color: age.warn ? '#b45309' : c.soft, fontWeight: age.warn ? '800' : '400', fontSize: 14 * f }}>{age.text}</Text>
        <Row>
          <Btn small label="💾 Save backup file" onPress={saveFile} />
          <Btn small kind="secondary" label="📋 Copy backup" onPress={copy} />
          <Btn small kind="secondary" label="📂 Restore from file" onPress={fromFile} />
          <Btn small kind="secondary" label="📝 Paste a backup" onPress={() => setPasteBox(b => !b)} />
          {hasUndo && <Btn small kind="danger" label="↩ Undo last restore" onPress={() => confirm('Undo the last restore?', 'The app goes back to how it was before the restore.', async () => { if (await undoRestore()) toast('Restore undone ↩'); else toast('Nothing to undo'); }, 'Undo')} />}
        </Row>
        {pasteBox && <>
          <Field value={pasteVal} onChangeText={setPasteVal} multiline placeholder="Paste the backup text here" style={{ minHeight: 90, fontSize: 13 }} accessibilityLabel="Backup text" />
          <Row>
            <Btn small kind="secondary" label="Paste from clipboard" onPress={async () => setPasteVal(await pasteText())} />
            <Btn small label="Check backup" onPress={() => offer(pasteVal)} disabled={!pasteVal.trim()} />
          </Row>
        </>}
        {pending && (
          <View style={{ backgroundColor: c.sunSoft, borderRadius: 12, padding: 12, gap: 8, borderWidth: 2, borderColor: c.sun }}>
            <Text style={{ fontWeight: '900', color: c.ink, fontSize: 16 * f }}>Restore this backup?</Text>
            <P>From {pending.savedAt ? new Date(pending.savedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'an unknown date'}: {backupSummary(pending.r)}.</P>
            <P style={{ color: '#b45309', fontWeight: '700' }}>This replaces everything in the app right now. You can undo it afterward.</P>
            <Row>
              <Btn small kind="good" label="Replace and restore" onPress={async () => { const r = pending.r; setPending(null); setPasteVal(''); await restore(r); toast('Backup restored ✅'); }} />
              <Btn small kind="ghost" label="Cancel" onPress={() => setPending(null)} />
            </Row>
          </View>
        )}

        <Btn kind="sky" label="📊 Progress report" onPress={() => router.push('/report')} />
        <Text style={{ fontSize: 16 * f, color: c.ink, fontWeight: '700' }}>Reset for {me.name}</Text>
        <P small>Word lists are kept.</P>
        <Row>
          <Btn small kind="danger" label="Tokens" onPress={() => confirm('Reset tokens?', `${me.name}'s tokens go back to 0.`, () => { updateKid(k => { k.tokens = 0; }); toast('Reset done'); }, 'Reset')} />
          <Btn small kind="danger" label="Best scores" onPress={() => confirm('Reset best scores?', 'All game best scores are cleared.', () => { updateKid(k => { k.best = {}; }); toast('Reset done'); }, 'Reset')} />
          <Btn small kind="danger" label="Word progress" onPress={() => confirm('Reset word progress?', 'Mastered, tricky and review history are cleared.', () => { updateKid(k => { k.stats = {}; k.hist = {}; k.spelled = 0; }); toast('Reset done'); }, 'Reset')} />
        </Row>
      </Card>

      <Card>
        <H>🌈 Comfort & accessibility</H>
        <Toggle label="🎵 Game sounds" value={s.sfx} onChange={v => { set('sfx', v); if (v) sfx('coin'); }} />
        <Toggle label="🗣️ Spoken words" help="When off, use 👀 Peek to see the word" value={s.voice} onChange={v => set('voice', v)} />
        <Toggle label="🔠 Bigger text and buttons" value={s.big} onChange={v => set('big', v)} />
        <Toggle label="🌓 High contrast" value={s.hc} onChange={v => set('hc', v)} />
        <Toggle label="🧘 Calmer motion" help="No screen shaking in games" value={s.calm} onChange={v => set('calm', v)} />
      </Card>

      <Card>
        <H>⭐ About & support</H>
        <P>Spelling Stars is free, with no ads and no tracking. Everything stays on this device.</P>
        {SHOW_SUPPORT_LINK && <>
          <P>If it's helping your family, you can buy me a coffee to help cover app-store fees and keep new games coming. Thank you!</P>
          <Pressable onPress={() => setGateUrl(SUPPORT_URL)} accessibilityRole="button" accessibilityLabel="Buy me a coffee. Opens a website after a grown-up check."
            style={({ pressed }) => ({ backgroundColor: '#ffdd00', borderRadius: 14, paddingVertical: 14 * f, alignItems: 'center', opacity: pressed ? .85 : 1, borderWidth: 2, borderColor: '#e5b800' })}>
            <Text style={{ color: '#1e1b4b', fontSize: 18 * f, fontWeight: '900' }}>☕ Buy me a coffee</Text>
          </Pressable>
          <P small>Opens buymeacoffee.com in your browser. Completely optional; the app is the same either way.</P>
        </>}
        <Btn kind="secondary" small label="🔒 Privacy policy" onPress={() => setGateUrl(PRIVACY_URL)} />
        <P small>Version {APP_VERSION}</P>
      </Card>
      <GrownUpGate url={gateUrl} onClose={() => setGateUrl(null)} />
    </Screen>
  );
}

export default function SettingsScreen() {
  return <GrownUpOnly><SettingsScreenInner /></GrownUpOnly>;
}
