import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';

export function formatQuestTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return Math.floor(safe / 60) + ':' + String(safe % 60).padStart(2, '0');
}

export default function MultiProgress({ distance, duration, meters, seconds }: {
  distance: number; duration: number; meters: number; seconds: number;
}) {
  return <View style={styles.root}>
    <Text style={styles.heading}>OBA WARUNKI SĄ WYMAGANE</Text>
    <Condition label="GPS" value={`${Math.floor(distance)} / ${meters} M`} progress={meters > 0 ? distance / meters : 0} />
    <Condition label="AKTYWNY CZAS" value={`${formatQuestTime(duration)} / ${formatQuestTime(seconds)}`} progress={seconds > 0 ? duration / seconds : 0} />
    <Text style={styles.hint}>Pozostań na ekranie misji z aktywnym GPS, aż oba warunki zostaną spełnione.</Text>
  </View>;
}
function Condition({ label, value, progress }: { label: string; value: string; progress: number }) {
  const safeProgress = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return <View style={styles.condition}>
    <Text style={styles.label}>{label} · {value} {safeProgress >= 1 ? '✓' : ''}</Text>
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(safeProgress * 100) }} style={styles.track}><View style={[styles.fill, { width: `${safeProgress * 100}%` as DimensionValue }]} /></View>
  </View>;
}
const styles = StyleSheet.create({
  root: { marginTop: 16, padding: 16, backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, borderRadius: 18 },
  heading: { color: C.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  condition: { marginTop: 14 }, label: { color: C.text, fontSize: 12 },
  track: { height: 5, marginTop: 8, backgroundColor: C.line, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: C.cyan },
  hint: { color: C.textMuted, fontSize: 11, lineHeight: 17, marginTop: 14 },
});
