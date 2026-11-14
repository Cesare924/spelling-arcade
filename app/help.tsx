import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupported as scanSupported } from 'expo-text-extractor';
import { useApp } from '../src/store/AppContext.tsx';
import { GrownUpOnly } from '../src/components/GrownUpOnly.tsx';
import { Screen, Card, H, P, Btn, Row, Field, useLook } from '../src/components/ui.tsx';
import { plural, profileOf } from '../src/logic/state.ts';
import { backupAge } from '../src/logic/backup.ts';
import { usVoices, say, type VoiceInfo } from '../src/speech.ts';
import { GrownUpGate } from '../src/components/GrownUpGate.tsx';
import { SHOW_SUPPORT_LINK, SUPPORT_URL, PRIVACY_URL } from '../src/config.ts';

const FAQ: [string, [string, string][]][] = [
  ['🚀 Getting started', [
    ['What is Spelling Arcade?', 'A spelling practice app for kids in grades K to 6. Kids hear a word, spell it, and earn tokens they spend on games.'],
    ['How do I set it up?', 'Tap "Run setup again" at the top of this page. It walks you through adding a kid, choosing a grade, adding a first word list, setting a PIN and testing the voice.'],
    ['How do I add another kid?', 'Settings › Kids › Add a kid. Each kid has their own words, tokens, progress and settings. Kids switch by tapping their picture on the home screen.']]],
  ['📝 Word lists & scanning', [
    ["How do I add this week's school words?", 'My Words › New list, then type the words (spaces or commas between them) or tap Scan list to take a photo of the paper.'],
    ['How does scanning work?', 'Take a clear, bright photo of the list. The phone reads the words itself (nothing is uploaded), then you can tap any it got wrong to skip them before adding.'],
    ['What are the grade-level lists?', 'Forty weeks of words for each grade band (K–1, 2–3, 4–6), grouped by spelling pattern and topic, with a built-in sentence for every word. Add any week from My Words › Grade-level word lists.'],
    ['How do test dates work?', 'Give a list a test date in My Words. During the week before, the home screen shows a reminder, that list comes first in practice, and the whole-year mix includes more of its words.'],
    ['Can I add my own sentence for a word?', 'Yes. In My Words, hold a word and type a short sentence that uses it. Kids hear it with the 💬 Sentence button, with the word blanked out on screen.'],
    ['Are old lists kept?', 'Yes. Every list stays all year. Practice any past list, the whole-year mix, or every word.']]],
  ['✏️ Practice', [
    ['What are Spell, Unscramble and Missing letters?', "Spell: hear the word and spell it. Unscramble: tap the word's mixed-up letters in order. Missing letters: some letters are blanked out and kids spell the whole word."],
    ['What is Review time?', 'Spaced review. A word spelled right on the first try comes back in 1, 3, 7, 14, then 30 days. A missed word comes back the same day. Review time shows the words due today.'],
    ['What are tricky words?', "Words missed before. A word leaves the list after it's spelled right on the first try twice in a row."],
    ['How do stars and streaks work?', 'Each finished round earns 1 to 3 stars, based on how many words were right on the first try. The streak counts days in a row with practice.'],
    ['Letter tiles or keyboard?', 'Settings › Practice › How to spell. Auto uses tiles for K–1 and the keyboard for older kids.']]],
  ['🔊 Sound & voices', [
    ["I can't hear the word.", "Use the Sound check above. Most often the phone is on silent or the volume is low. Also check the phone has an English (US) text-to-speech voice."],
    ['How do I choose a male or female voice?', "Settings › Practice › Voice. The voices come from the phone, so the choices differ by phone. You can add free voices: on Android, Settings › Text-to-speech; on iPhone, Settings › Accessibility › Spoken Content › Voices › English (US)."],
    ['What do Sentence and Meaning do?', "They read a short sentence that uses the word (or, for grades 4–6, explain its meaning). The word is blanked out on screen so it isn't given away."]]],
  ['🪙 Tokens, games & limits', [
    ['How do tokens work?', 'Each correct word earns a token (or 2 on the first try, if you turn that on). Games cost 1 to 3 tokens. Add bonus tokens in Settings › Grown-up tools.'],
    ['Can I limit game time?', 'Yes. Settings › Tokens & games › Games per day or Play time per day. A game in progress ends with "Time for a break!" when time runs out.'],
    ['Can I hide a game?', 'Yes. Settings › Games to show. Kids can also mark favorites with the ☆ on each game.']]],
  ['🔒 PIN & privacy', [
    ['What does the PIN protect?', "My Words, Settings, the progress report and this Help page. It stays unlocked for 10 minutes after you enter it. It keeps young kids out but isn't strong security."],
    ['I forgot the PIN.', 'On the PIN pad, tap "Forgot PIN?" and answer the multiplication question to remove it.'],
    ['Where is our data kept?', 'Only on this phone. Scanning happens on the phone too. No accounts, no ads and no tracking. Save a backup so nothing is lost if the phone is replaced.'],
    ['Where is the privacy policy?', 'Tap "Privacy policy" at the bottom of this page, or in Settings › About & support. It opens cesare924.github.io/spelling-stars in your browser.']]],
  ['💾 Backup', [
    ['How do I back up?', 'Settings › Grown-up tools › Save backup file, then save it to Google Drive, Files or email. Copy backup puts it on the clipboard instead.'],
    ['How do I restore?', "Use Restore from file or Paste a backup. You'll see what's inside before anything changes, and you can undo a restore. Backups from the web version work too."]]],
  ...(SHOW_SUPPORT_LINK ? [['☕ Supporting the app', [
    ['How can I support Spelling Arcade?', "Spelling Arcade is free with no ads. If it's helping your family, you can buy the developer a coffee with the button at the bottom of this page or in Settings › About & support. It's completely optional, and the app is the same either way."]]]] as [string, [string, string][]][] : []),
];
const SOUND_TIPS = 'Turn the volume up and turn off silent mode. Make sure "Spoken words" is on in Settings › Comfort. Check the phone has an English (US) voice: Android Settings › Text-to-speech, or iPhone Settings › Accessibility › Spoken Content › Voices.';

function HelpInner() {
  const { root, kid, updateKid } = useApp();
  const { c, f } = useLook();
  const [gateUrl, setGateUrl] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [out, setOut] = useState<{ text: string; actions?: { label: string; on: () => void }[] } | null>(null);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  useEffect(() => { usVoices().then(setVoices); }, []);
  const name = profileOf(root).name;

  function check(k: string) {
    if (k === 'sound') {
      if (!kid.set.voice) { setOut({ text: `🔇 Spoken words are turned off for ${name}.`, actions: [{ label: 'Turn them on', on: () => { updateKid(x => { x.set.voice = true; }); setOut({ text: '✅ Spoken words are on. Run the sound check again.' }); } }] }); return; }
      say('cat', kid.set);
      setOut({ text: 'Did you hear the word "cat"?', actions: [
        { label: 'Yes 👍', on: () => setOut({ text: '✅ Sound works. Words will be read aloud during practice.' }) },
        { label: 'No', on: () => setOut({ text: "🔇 Let's fix the sound: " + SOUND_TIPS, actions: [{ label: 'Try again', on: () => check('sound') }] }) },
      ] });
    } else if (k === 'voice') {
      const nF = voices.filter(v => v.gender === 'female').length, nM = voices.filter(v => v.gender === 'male').length;
      const chosen = voices.find(v => v.id === kid.set.voiceName);
      setOut(voices.length
        ? { text: `✅ ${plural(voices.length, 'American English voice')} on this phone (${nF} female, ${nM} male). ${name} hears: ${chosen ? chosen.name : 'the automatic choice'}.` + ((kid.set.voiceGender === 'male' && !nM) || (kid.set.voiceGender === 'female' && !nF) ? ` ⚠️ No ${kid.set.voiceGender} voice found. Add one in the phone's settings.` : ''), actions: [{ label: 'Change voice', on: () => router.push('/settings') }] }
        : { text: '⚠️ No American English voices found. ' + SOUND_TIPS });
    } else if (k === 'backup') {
      const a = backupAge(root.lastBackup);
      setOut({ text: (a.warn ? '⚠️ ' : '✅ ') + (a.days === 0 ? 'Backed up today.' : a.days === 1 ? 'Backed up yesterday.' : a.text), actions: [{ label: 'Go to Backup', on: () => router.push('/settings') }] });
    } else if (k === 'scan') {
      setOut({ text: scanSupported ? '✅ Scanning is ready. For best results, photograph the list flat, in bright light, filling the screen.' : "❌ Scanning isn't supported on this phone. You can still type words in My Words." });
    } else if (k === 'save') {
      AsyncStorage.setItem('ss.test', '1').then(() => AsyncStorage.removeItem('ss.test'))
        .then(() => setOut({ text: '✅ Progress is saved on this phone. Save a backup now and then so it isn\'t lost if the phone is replaced.', actions: [{ label: 'Go to Backup', on: () => router.push('/settings') }] }))
        .catch(() => setOut({ text: "❌ This phone isn't letting the app save. Free up some storage space, then try again." }));
    }
  }

  const ql = q.trim().toLowerCase();
  const sections = FAQ.map(([sec, qs]) => [sec, qs.filter(([a, b]) => !ql || (a + ' ' + b).toLowerCase().includes(ql))] as const).filter(([, qs]) => qs.length);
  return (
    <Screen>
      <Row>
        <Btn label="🧭 Run setup again" onPress={() => router.push('/setup')} style={{ flex: 1 }} />
        <Btn kind="secondary" label="⚙️ Settings" onPress={() => router.push('/settings')} style={{ flex: 1 }} />
      </Row>
      <Card>
        <H>🛠️ Fix a problem</H>
        <P small>Tap a check. Each one tests the app on this phone.</P>
        <Row>
          {[['sound', '🔊 Sound check'], ['voice', '🗣️ Voice check'], ['backup', '💾 Backup check'], ['scan', '📷 Scanning check'], ['save', '☁️ Saving check']].map(([k, l]) =>
            <Btn key={k} small kind="secondary" label={l} onPress={() => check(k)} />)}
        </Row>
        {out && (
          <View style={{ backgroundColor: c.brandSoft, borderRadius: 12, padding: 12, gap: 8 }}>
            <Text style={{ color: c.ink, fontSize: 15 * f }}>{out.text}</Text>
            {out.actions && <Row>{out.actions.map(a => <Btn key={a.label} small label={a.label} onPress={a.on} />)}</Row>}
          </View>
        )}
      </Card>
      <Card>
        <H>📖 Questions & answers</H>
        <Field value={q} onChangeText={setQ} placeholder="Search help (for example: sound, PIN, scan)" autoCorrect={false} accessibilityLabel="Search help" />
        {!sections.length && <P>No matches. Try another word.</P>}
        {sections.map(([sec, qs]) => (
          <View key={sec} style={{ gap: 6 }}>
            <Text style={{ fontWeight: '900', color: c.brandDark, fontSize: 16 * f, marginTop: 6 }}>{sec}</Text>
            {qs.map(([qq, a]) => {
              const on = open === qq || !!ql;
              return (
                <Pressable key={qq} onPress={() => setOpen(on && !ql ? null : qq)} accessibilityRole="button" accessibilityState={{ expanded: on }}
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 12, backgroundColor: '#fff' }}>
                  <Text style={{ fontWeight: '800', color: c.ink, fontSize: 15 * f }}>{on ? '▾ ' : '▸ '}{qq}</Text>
                  {on && <Text style={{ color: c.soft, fontSize: 15 * f, marginTop: 6, lineHeight: 21 * f }}>{a}</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Card>
      {SHOW_SUPPORT_LINK && (
        <Card style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
          <H>☕ Support Spelling Arcade</H>
          <P>Spelling Arcade is free, with no ads. If it's helping your family, you can buy me a coffee to help cover app-store fees and keep new games coming. Thank you!</P>
          <Pressable onPress={() => setGateUrl(SUPPORT_URL)} accessibilityRole="button" accessibilityLabel="Buy me a coffee. Opens a website after a grown-up check."
            style={({ pressed }) => ({ backgroundColor: '#ffdd00', borderRadius: 14, paddingVertical: 14 * f, alignItems: 'center', opacity: pressed ? .85 : 1, borderWidth: 2, borderColor: '#e5b800' })}>
            <Text style={{ color: '#1e1b4b', fontSize: 18 * f, fontWeight: '900' }}>☕ Buy me a coffee</Text>
          </Pressable>
          <P small>Opens buymeacoffee.com in your browser after a quick grown-up check.</P>
        </Card>
      )}
      <Btn kind="secondary" small label="🔒 Privacy policy" onPress={() => setGateUrl(PRIVACY_URL)} />
      <GrownUpGate url={gateUrl} onClose={() => setGateUrl(null)} />
    </Screen>
  );
}

export default function Help() {
  return <GrownUpOnly><HelpInner /></GrownUpOnly>;
}
