// Shared building blocks: colors, screen wrapper, buttons, cards, letter tiles.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const C = {
  bg: '#f5f3ff', card: '#ffffff', ink: '#1e1b4b', soft: '#4c4f6b', line: '#ddd6fe',
  brand: '#7c3aed', brandDark: '#5b21b6', sun: '#f59e0b', good: '#16a34a', goodBg: '#dcfce7',
  bad: '#dc2626', badBg: '#fee2e2', sky: '#0ea5e9',
};

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      {scroll
        ? <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        : <View style={[s.pad, { flex: 1 }]}>{children}</View>}
    </SafeAreaView>
  );
}

type Kind = 'primary' | 'secondary' | 'ghost' | 'good' | 'danger';
export function Btn({ label, onPress, kind = 'primary', disabled, style, big }: {
  label: string; onPress: () => void; kind?: Kind; disabled?: boolean; style?: ViewStyle; big?: boolean;
}) {
  const bg = { primary: C.brand, secondary: '#ede9fe', ghost: 'transparent', good: C.good, danger: C.bad }[kind];
  const fg = kind === 'secondary' || kind === 'ghost' ? C.brandDark : '#fff';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? .45 : pressed ? .8 : 1 }, big && s.btnBig, style]}>
      <Text style={[s.btnText, { color: fg }, big && { fontSize: 22 }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function H({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[s.h, style]}>{children}</Text>;
}
export function P({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[s.p, style]}>{children}</Text>;
}
export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.row, style]}>{children}</View>;
}

/** Tap-to-spell letter tiles. `used` marks tiles already placed. */
export function Tiles({ tiles, used, onTap }: { tiles: string[]; used: boolean[]; onTap: (i: number) => void }) {
  return (
    <View style={s.tiles}>
      {tiles.map((t, i) => (
        <Pressable key={i} disabled={used[i]} onPress={() => onTap(i)} accessibilityLabel={`letter ${t}`}
          style={({ pressed }) => [s.tile, used[i] && { opacity: .25 }, pressed && { transform: [{ scale: .94 }] }]}>
          <Text style={s.tileText}>{t}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Option chips for settings. */
export function Chips<T extends string | number>({ value, options, onChange }: {
  value: T; options: { v: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <View style={s.chips}>
      {options.map(o => (
        <Pressable key={String(o.v)} onPress={() => onChange(o.v)} accessibilityState={{ selected: o.v === value }}
          style={[s.chip, o.v === value && s.chipOn]}>
          <Text style={[s.chipText, o.v === value && { color: '#fff' }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  pad: { padding: 16, gap: 12 },
  btn: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnBig: { paddingVertical: 18 },
  btnText: { fontSize: 17, fontWeight: '800' },
  card: { backgroundColor: C.card, borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: C.line },
  h: { fontSize: 20, fontWeight: '900', color: C.ink },
  p: { fontSize: 16, color: C.soft, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  tile: { width: 48, height: 52, borderRadius: 12, backgroundColor: '#fef3c7', borderWidth: 2, borderColor: C.sun, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontSize: 26, fontWeight: '900', color: C.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#ede9fe' },
  chipOn: { backgroundColor: C.brand },
  chipText: { fontSize: 15, fontWeight: '700', color: C.brandDark },
});
