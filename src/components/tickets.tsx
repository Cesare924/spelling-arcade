// Small shared pieces for tickets and prizes.
import { Text, View } from 'react-native';
import { useLook, Em } from './ui.tsx';
import type { FamReq } from '../logic/state.ts';

/** Ticket colors (arcade red). Text colors pass contrast on white and on the soft background. */
export const TICKET = { main: '#e11d48', ink: '#9f1239', strong: '#be123c', soft: '#fff1f3', line: '#fda4af' };

export function TicketBadge({ n, big, label }: { n: number; big?: boolean; label?: string }) {
  const { f } = useLook();
  return (
    <View accessible accessibilityLabel={`${n} ${label || 'tickets'}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: big ? 6 : 4, paddingHorizontal: big ? 14 : 10, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: TICKET.line }}>
      <Text style={{ fontSize: (big ? 22 : 17) * f }}>🎟️</Text>
      <Text style={{ fontSize: (big ? 24 : 18) * f, fontWeight: '900', color: TICKET.strong }}>{n}</Text>
      <Text style={{ fontSize: (big ? 15 : 13) * f, fontWeight: '800', color: TICKET.ink }}>{label || 'tickets'}</Text>
    </View>
  );
}

export function GoalBar({ goal, have }: { goal: { em: string; name: string; price: number }; have: number }) {
  const { c, f } = useLook();
  const pct = Math.max(0, Math.min(1, have / goal.price)), done = have >= goal.price;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} accessible
      accessibilityLabel={`Saving for ${goal.name}: ${Math.min(have, goal.price)} of ${goal.price} tickets`}>
      <Em em={goal.em} size={30} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 14 * f, fontWeight: '800', color: c.ink }}>{done ? `You can get the ${goal.name}!` : `Saving for: ${goal.name}`}</Text>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: '#ffe4e6', overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: 10, borderRadius: 5, backgroundColor: done ? c.good : TICKET.main }} />
        </View>
        <Text style={{ fontSize: 12.5 * f, color: c.soft }}>{Math.min(have, goal.price)} of {goal.price} tickets</Text>
      </View>
    </View>
  );
}

const ST = {
  wait: { label: 'Waiting', bg: '#ffedd5', fg: '#9a3412' },
  ok: { label: 'Got it!', bg: '#dcfce7', fg: '#166534' },
  no: { label: 'Not now', bg: '#f1f5f9', fg: '#475569' },
};
export function when(t: number) {
  if (!t) return '';
  const d = new Date(t), now = new Date();
  if (d.toDateString() === now.toDateString()) return 'today';
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
/** One family prize request with its status. */
export function ReqRow({ q, who }: { q: FamReq; who?: string }) {
  const { c, f } = useLook();
  const st = ST[q.st];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, backgroundColor: c.bg }}>
      <Text style={{ fontSize: 28 }}>{q.em}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', fontSize: 14.5 * f, color: c.ink }}>{who ? `${who}: ` : ''}{q.name}</Text>
        <Text style={{ fontSize: 12.5 * f, color: c.soft }}>{q.price} tickets · asked {when(q.at)}{q.st === 'no' ? ' · tickets returned' : ''}</Text>
      </View>
      <Text style={{ fontSize: 12.5 * f, fontWeight: '800', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, overflow: 'hidden', backgroundColor: st.bg, color: st.fg }}>{st.label}</Text>
    </View>
  );
}
