import { Text, View } from 'react-native';
import { useApp } from '../src/store/AppContext.tsx';
import { Screen, Card, H, P, C } from '../src/components/ui.tsx';
import { GAME_IDS, plural } from '../src/logic/state.ts';

const NAMES: Record<string, string> = {
  derby: '⚾ Home Run Derby', race: '🏎️ Race Car Rally', soccer: '⚽ Penalty Kick Shootout', hoops: '🏀 Hoop Shot',
  unicorn: '🦄 Unicorn Rainbow Dash', balloon: '🎈 Balloon Spell Pop', catcher: '🧺 Letter Catcher', moonrocket: '🌕 Moon Rocket',
  scramble: '🔀 Scramble Rush', snake: '🐍 Spelling Snake', wheel: '🎡 Spin & Spell', detective: '🔍 Letter Detective',
  memory: '🧠 Memory Match', icecream: '🍦 Ice Cream Tower', space: '🚀 Space Star Catcher', bonk: '🐹 Garden Bonk',
};

// Placeholder: the 16 games move over from the prototype in the next stage.
export default function Arcade() {
  const { kid } = useApp();
  return (
    <Screen>
      <Card style={{ alignItems: 'center' }}>
        <H>🪙 {plural(kid.tokens, 'token')}</H>
        <P>Games are on their way to the app version. Keep practicing — your tokens are saved.</P>
      </Card>
      <View style={{ gap: 8 }}>
        {GAME_IDS.map(id => (
          <Card key={id} style={{ paddingVertical: 12, opacity: .6 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink }}>{NAMES[id]}</Text>
            <Text style={{ color: C.soft }}>Coming soon</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
