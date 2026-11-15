// Shared building blocks: colors, screen wrapper, buttons, cards, tiles, options, sheets.
// "Bigger text" and "High contrast" settings are applied here for every screen.
import React from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, TextInput, View, type ViewStyle, type TextStyle, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TILE_THEMES } from '../data/prizes.ts';
import { lookIn } from '../logic/prizes.ts';
import { useApp } from '../store/AppContext.tsx';

const BASE = {
  bg: '#f5f3ff', card: '#ffffff', ink: '#1e1b4b', soft: '#4c4f6b', line: '#ddd6fe',
  brand: '#7c3aed', brandDark: '#5b21b6', brandSoft: '#ede9fe', sun: '#f59e0b', sunSoft: '#fef3c7',
  good: '#16a34a', goodBg: '#dcfce7', bad: '#dc2626', badBg: '#fee2e2', sky: '#0284c7', tile: '#fef3c7',
};
const HIGH = {
  ...BASE, bg: '#ffffff', ink: '#000000', soft: '#111827', line: '#1e1b4b', brand: '#4c1d95', brandDark: '#2e1065',
  brandSoft: '#ddd6fe', good: '#15803d', bad: '#b91c1c', sky: '#075985',
};
export type Palette = typeof BASE;
/** Default colors (for places outside a kid's settings). */
export const C = BASE;

export function useLook() {
  const { kid } = useApp();
  return { c: kid.set.hc ? HIGH : BASE, f: kid.set.big ? 1.18 : 1, hc: kid.set.hc };
}

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const { c } = useLook();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom', 'left', 'right']}>
      {scroll
        ? <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        : <View style={{ padding: 16, gap: 12, flex: 1 }}>{children}</View>}
    </SafeAreaView>
  );
}

export type Kind = 'primary' | 'secondary' | 'ghost' | 'good' | 'danger' | 'sky';
export function Btn({ label, onPress, kind = 'primary', disabled, style, big, small }: {
  label: string; onPress: () => void; kind?: Kind; disabled?: boolean; style?: ViewStyle; big?: boolean; small?: boolean;
}) {
  const { c, f, hc } = useLook();
  const bg = { primary: c.brand, secondary: c.brandSoft, ghost: 'transparent', good: c.good, danger: c.bad, sky: c.sky }[kind];
  const fg = kind === 'secondary' || kind === 'ghost' ? c.brandDark : '#fff';
  const size = (big ? 22 : small ? 15 : 17) * f;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [{
        backgroundColor: bg, opacity: disabled ? .45 : pressed ? .8 : 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        paddingVertical: (big ? 18 : small ? 9 : 13) * f, paddingHorizontal: small ? 12 : 18,
        borderWidth: hc || kind === 'ghost' ? 2 : 0, borderColor: hc ? c.ink : c.line,
      }, style]}>
      <Text style={{ color: fg, fontSize: size, fontWeight: '800', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { c, hc } = useLook();
  return <View style={[{ backgroundColor: c.card, borderRadius: 18, padding: 16, gap: 10, borderWidth: hc ? 2 : 1, borderColor: c.line }, style]}>{children}</View>;
}
export function H({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { c, f } = useLook();
  return <Text style={[{ fontSize: 20 * f, fontWeight: '900', color: c.ink }, style]}>{children}</Text>;
}
export function P({ children, style, small }: { children: React.ReactNode; style?: TextStyle; small?: boolean }) {
  const { c, f } = useLook();
  return <Text style={[{ fontSize: (small ? 13.5 : 16) * f, color: c.soft, lineHeight: (small ? 19 : 22) * f }, style]}>{children}</Text>;
}
export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }, style]}>{children}</View>;
}
export function Field(props: TextInputProps) {
  const { c, f } = useLook();
  return <TextInput placeholderTextColor="#8b8fa8" {...props}
    style={[{ fontSize: 18 * f, color: c.ink, borderWidth: 2, borderColor: c.line, borderRadius: 12, padding: 12, backgroundColor: '#fff' }, props.style]} />;
}

/** Tap-to-spell letter tiles. `used` marks tiles already placed. */
export function Tiles({ tiles, used, onTap }: { tiles: string[]; used: boolean[]; onTap: (i: number) => void }) {
  const { c, f } = useLook();
  const { kid } = useApp();
  // Prize Counter looks: colored letter tiles
  const tt = TILE_THEMES[lookIn(kid, 'tiles')];
  const tileBg = tt ? tt.bg : c.tile, tileLine = tt ? tt.line : c.sun;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {tiles.map((t, i) => (
        <Pressable key={i} disabled={used[i]} onPress={() => onTap(i)} accessibilityLabel={`letter ${t}`}
          style={({ pressed }) => [{ width: 48 * f, height: 52 * f, borderRadius: 12, backgroundColor: tileBg, borderWidth: 2, borderColor: tileLine, alignItems: 'center', justifyContent: 'center' },
            used[i] && { opacity: .25 }, pressed && { transform: [{ scale: .94 }] }]}>
          <Text style={{ fontSize: 26 * f, fontWeight: '900', color: c.ink }}>{t}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Row of choices (one selected). */
export function Chips<T extends string | number | boolean>({ value, options, onChange, label, help }: {
  value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label?: string; help?: string;
}) {
  const { c, f } = useLook();
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={{ fontSize: 16 * f, color: c.ink, fontWeight: '700' }}>{label}</Text>}
      {help && <Text style={{ fontSize: 13 * f, color: c.soft }}>{help}</Text>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map(o => {
          const on = o.v === value;
          return (
            <Pressable key={String(o.v)} onPress={() => onChange(o.v)} accessibilityRole="radio" accessibilityState={{ selected: on }}
              style={{ paddingVertical: 8 * f, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? c.brand : c.brandSoft, borderWidth: 2, borderColor: on ? c.brandDark : 'transparent' }}>
              <Text style={{ fontSize: 15 * f, fontWeight: '700', color: on ? '#fff' : c.brandDark }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Toggle({ label, value, onChange, help }: { label: string; value: boolean; onChange: (v: boolean) => void; help?: string }) {
  const { c, f } = useLook();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, gap: 10 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16 * f, color: c.ink, fontWeight: '600' }}>{label}</Text>
        {help && <Text style={{ fontSize: 13 * f, color: c.soft }}>{help}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.brand, false: '#d1d5db' }} accessibilityLabel={label} />
    </View>
  );
}

/** Bottom sheet style pop-up. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { c } = useLook();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,10,40,.5)', justifyContent: 'center', padding: 18 }} onPress={onClose}>
        <Pressable style={{ backgroundColor: c.card, borderRadius: 22, padding: 18, gap: 12, maxHeight: '88%' }} onPress={() => {}}>
          <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Small header icon button. */
export function IconBtn({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={10} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
    </Pressable>
  );
}

/** Stat block (number + label). */
export function Stat({ n, label }: { n: string | number; label: string }) {
  const { c, f } = useLook();
  return (
    <View style={{ alignItems: 'center', minWidth: 90, flexGrow: 1, flexBasis: '28%', paddingVertical: 6 }}>
      <Text style={{ fontSize: 24 * f, fontWeight: '900', color: c.ink }}>{n}</Text>
      <Text style={{ color: c.soft, fontSize: 13 * f, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
