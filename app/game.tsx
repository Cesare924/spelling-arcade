// Runs one game. The games are the same canvas games as the web version, bundled
// with the app and shown offline in a WebView. They talk to the app with small messages.
import { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useApp } from '../src/store/AppContext.tsx';
import { GAME_HTML } from '../src/games/gameHtml.ts';
import { GAMES } from '../src/games/meta.ts';
import { GAME_IDS, allWords, dayRec, norm, today, type GameId } from '../src/logic/state.ts';
import { builtinSent } from '../src/logic/practice.ts';
import { sayFromGame, stopSpeech } from '../src/speech.ts';
import { payout, LEVEL_LABEL } from '../src/logic/tickets.ts';
import { awardTickets, goalOf, looksBySlot } from '../src/logic/prizes.ts';

export default function Game() {
  const { id: rawId } = useLocalSearchParams<{ id?: string }>();
  const id = (GAME_IDS.includes(rawId as GameId) ? rawId : 'derby') as GameId;
  const { kid, root, updateKid } = useApp();
  const web = useRef<WebView>(null);
  // Tickets are paid only for games that were paid for with tokens.
  const paid = useRef(0);

  // Everything the game needs, captured once when the screen opens.
  const init = useMemo(() => {
    const words = allWords(kid), sent: Record<string, string> = {};
    for (const w of words) { const s = root.sent[norm(w)] || builtinSent(w, kid.set.grade); if (s) sent[norm(w)] = s; }
    const day = kid.day.date === today() ? kid.day : { games: 0, ms: 0 };
    return {
      id, title: GAMES[id].title, em: GAMES[id].em, words, sent, tokens: kid.tokens, best: kid.best, day: { games: day.games, ms: day.ms },
      looks: looksBySlot(kid),
      set: { diff: kid.set.diff, calm: kid.set.calm, sfx: kid.set.sfx, voice: kid.set.voice, twice: kid.set.twice, grade: kid.set.grade, cost: kid.set.cost, maxGames: kid.set.maxGames, maxMin: kid.set.maxMin },
    };
  }, [id]);
  // The setup is written straight into the page, so it is there before any game code runs.
  const html = useMemo(() => GAME_HTML.replace('<head>', () => `<head><script>window.__SS_INIT=${JSON.stringify(init).replace(/</g, '\\u003c')};</script>`), [init]);

  // Messages from the game page are checked: known types only, the cost is always the
  // grown-up's setting, and numbers are limited to sensible ranges.
  function onMessage(e: WebViewMessageEvent) {
    let m: any; try { m = JSON.parse(String(e.nativeEvent.data).slice(0, 2000)); } catch { return; }
    if (!m || typeof m !== 'object') return;
    const n = (v: unknown, hi: number) => { const x = Math.floor(Number(v)); return Number.isFinite(x) ? Math.min(hi, Math.max(0, x)) : 0; };
    if (m.t === 'spend') { paid.current++; updateKid(k => { k.tokens = Math.max(0, k.tokens - k.set.cost); dayRec(k).games++; }); }
    else if (m.t === 'ms') updateKid(k => { dayRec(k).ms += n(m.ms, 60000); });
    else if (m.t === 'end') {
      // Only a game that was paid for with tokens can end: anything else is ignored.
      if (paid.current <= 0) return;
      paid.current--;
      const s = n(m.score, 1e6), prevBest = kid.best[id];
      const pay = payout(id, s, prevBest, Math.random());
      updateKid(k => {
        const prev = k.best[id]; if (prev == null || s > prev) k.best[id] = s;
        awardTickets(k, pay.total);
      });
      showTickets(pay, kid.tickets + pay.total);
    }
    else if (m.t === 'speak') sayFromGame(String(m.text || '').slice(0, 300), !!m.raw, kid.set);
    else if (m.t === 'exit') { stopSpeech(); if (router.canGoBack()) router.back(); else router.replace('/arcade'); }
  }

  // Sends the payout to the game-over screen, which shows the ticket strip.
  function showTickets(pay: ReturnType<typeof payout>, balance: number) {
    const rows: [string, number][] = [[LEVEL_LABEL[pay.level], pay.base]];
    if (pay.newBest) rows.push(['Beat your best', pay.newBest]);
    const goal = goalOf(root, kid, root.active);
    const note = goal
      ? (balance >= goal.price ? `You can get the ${goal.name} now!` : `${goal.price - balance} more for the ${goal.name}!`)
      : `You have ${balance} tickets.`;
    const msg = { total: pay.total, rows, jackpot: pay.jackpot, note };
    web.current?.injectJavaScript(`window.__tickets&&window.__tickets(${JSON.stringify(msg).replace(/</g, '\\u003c')});true;`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1e1b4b' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        <WebView
          ref={web}
          key={id}
          source={{ html, baseUrl: '' }}
          originWhitelist={['*']}
          onMessage={onMessage}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          // The game page is self-contained: it may not load or open anything else.
          onShouldStartLoadWithRequest={req => !req.url || req.url.startsWith('about:') || req.url.startsWith('data:')}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          javaScriptCanOpenWindowsAutomatically={false}
          geolocationEnabled={false}
          allowsLinkPreview={false}
          incognito
          setSupportMultipleWindows={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          textZoom={100}
          style={{ backgroundColor: '#1e1b4b' }}
        />
      </View>
    </SafeAreaView>
  );
}
