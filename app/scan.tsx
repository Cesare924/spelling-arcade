// Scan a printed spelling list. The photo is read on the phone (Google ML Kit on Android,
// Apple Vision on iPhone). Nothing is uploaded.
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { extractTextFromImage, isSupported } from 'expo-text-extractor';
import { useApp } from '../src/store/AppContext.tsx';
import { Screen, Card, Btn, H, P, Row, useLook } from '../src/components/ui.tsx';
import { curList, weekName, plural } from '../src/logic/state.ts';
import { addWords } from '../src/logic/practice.ts';
import { wordsFromScan } from '../src/logic/scan.ts';
import { sfx } from '../src/sfx.ts';

export default function Scan() {
  const { kid, updateKid, toast } = useApp();
  const { c, f } = useLook();
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState('');
  const [found, setFound] = useState<string[] | null>(null);
  const [skip, setSkip] = useState<Set<string>>(new Set());
  const L = curList(kid);

  async function take(camera: boolean) {
    try {
      const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { toast(camera ? 'Camera permission is needed to scan.' : 'Photo permission is needed.'); return; }
      const res = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (res.canceled || !res.assets?.length) return;
      const uri = res.assets[0].uri;
      setPhoto(uri); setBusy(true); setFound(null); setSkip(new Set());
      const lines = await extractTextFromImage(uri);
      const words = wordsFromScan(lines, L ? L.words : []);
      setFound(words);
      if (!words.length) toast('No new words found. Try a brighter, closer photo.');
    } catch {
      toast("Couldn't read that photo. Try again, or type the words.");
    } finally { setBusy(false); }
  }
  function addFound() {
    const keep = (found || []).filter(w => !skip.has(w));
    if (!keep.length) return;
    let n = 0; updateKid(k => { n = addWords(k, keep, weekName()); });
    sfx('coin', kid.set.sfx); toast(`Added ${plural(n, 'word')} ✅`);
    router.back();
  }
  const toggle = (w: string) => setSkip(s => { const n = new Set(s); if (n.has(w)) n.delete(w); else n.add(w); return n; });

  return (
    <Screen>
      <Card>
        <H>📷 Scan a spelling list</H>
        <P>Lay the paper flat in good light and fill the screen with the list. The photo is read on this phone and isn't uploaded.</P>
        {!isSupported && <P style={{ color: c.bad }}>Scanning isn't supported on this device. You can still type the words in My Words.</P>}
        <Row>
          <Btn label="📸 Take a photo" onPress={() => take(true)} disabled={busy || !isSupported} style={{ flex: 1 }} />
          <Btn kind="secondary" label="🖼️ Choose photo" onPress={() => take(false)} disabled={busy || !isSupported} style={{ flex: 1 }} />
        </Row>
        <P small>Words go into: {L ? L.name : `a new list (${weekName()})`}</P>
      </Card>
      {!!photo && <Image source={{ uri: photo }} style={{ width: '100%', height: 180, borderRadius: 14 }} resizeMode="cover" accessibilityLabel="Your photo" />}
      {busy && <View style={{ padding: 20 }}><ActivityIndicator size="large" color={c.brand} /><P style={{ textAlign: 'center' }}>Reading the words…</P></View>}
      {found && found.length > 0 && (
        <Card>
          <H>Found {plural(found.length, 'word')}</H>
          <P small>Tap any word that's wrong to skip it.</P>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {found.map(w => {
              const off = skip.has(w);
              return (
                <Pressable key={w} onPress={() => toggle(w)} accessibilityRole="checkbox" accessibilityState={{ checked: !off }}
                  style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: off ? '#f1f5f9' : c.goodBg, borderWidth: 2, borderColor: off ? c.line : c.good }}>
                  <Text style={{ fontSize: 17 * f, fontWeight: '700', color: off ? '#9ca3af' : c.ink, textDecorationLine: off ? 'line-through' : 'none' }}>{w}</Text>
                </Pressable>
              );
            })}
          </View>
          <Btn label={`Add ${plural(found.length - skip.size, 'word')}`} onPress={addFound} disabled={found.length === skip.size} />
        </Card>
      )}
    </Screen>
  );
}
