import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { HeroCardDefinition } from '../heroes/catalog';
import { SYSTEM_COLORS as C } from '../core';

type Props = {
  card: HeroCardDefinition;
  unlocked: boolean;
  active: boolean;
  index: number;
  onEquip: () => void;
};

export default function HeroCardTile({ card, unlocked, active, index, onEquip }: Props) {
  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 8) * 70).duration(340)} style={[styles.card, { borderColor: active ? card.accent : unlocked ? card.shadow : C.line }]}>
      <View style={[styles.glow, { backgroundColor: card.accentSoft }]} />
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.rarity, { color: unlocked ? card.accent : C.textVeryMuted }]}>{card.rarity}</Text>
          <Text style={styles.name}>{unlocked ? card.name : 'UNKNOWN FORM'}</Text>
          <Text style={[styles.codename, { color: unlocked ? card.accent : C.textVeryMuted }]}>{unlocked ? card.codename : 'LOCKED'}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: active ? card.accent : C.line }]}>
          <Text style={[styles.statusText, { color: active ? card.accent : unlocked ? C.textMuted : C.textVeryMuted }]}>{active ? 'ACTIVE' : unlocked ? 'UNLOCKED' : 'LOCKED'}</Text>
        </View>
      </View>

      <View style={styles.art}>
        <View style={[styles.aura, { borderColor: unlocked ? card.accent : C.line, backgroundColor: unlocked ? card.accentSoft : 'rgba(255,255,255,0.02)' }]} />
        <CardSignature card={card} unlocked={unlocked} />
        <View style={[styles.head, { borderColor: unlocked ? card.accent : C.line }]} />
        <View style={[styles.torso, shapeFor(card).torso, { borderColor: unlocked ? card.accent : C.line }]} />
        <View style={[styles.arm, styles.leftArm, shapeFor(card).arm, { borderColor: unlocked ? card.accent : C.line }]} />
        <View style={[styles.arm, styles.rightArm, shapeFor(card).arm, { borderColor: unlocked ? card.accent : C.line }]} />
        <View style={[styles.leg, styles.leftLeg, shapeFor(card).leg, { borderColor: unlocked ? card.accent : C.line }]} />
        <View style={[styles.leg, styles.rightLeg, shapeFor(card).leg, { borderColor: unlocked ? card.accent : C.line }]} />
        {!unlocked && <View style={styles.lockShade}><Text style={styles.lock}>◇</Text></View>}
      </View>

      <Text style={styles.lore}>{unlocked ? card.lore : card.unlockText}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={active ? `${card.name} aktywny` : unlocked ? `Ustaw ${card.name}` : `${card.name} zablokowany`}
        disabled={!unlocked || active}
        onPress={onEquip}
        style={({ pressed }) => [
          styles.button,
          { borderColor: unlocked ? card.accent : C.line, backgroundColor: active ? card.accentSoft : 'rgba(4,16,20,0.72)' },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonText, { color: unlocked ? card.accent : C.textVeryMuted }]}>
          {active ? 'AKTYWNY BOHATER' : unlocked ? 'USTAW BOHATERA' : card.unlockText.toUpperCase()}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function shapeFor(card: HeroCardDefinition) {
  if (card.visual === 'TITAN') return { torso: { width: 92 }, arm: { width: 25 }, leg: { width: 28 } };
  if (card.visual === 'RUNNER') return { torso: { width: 64 }, arm: { width: 16 }, leg: { width: 20 } };
  if (card.visual === 'WRAITH') return { torso: { opacity: 0.68 }, arm: { opacity: 0.62 }, leg: { opacity: 0.62 } };
  if (card.visual === 'KING' || card.visual === 'ASCENDANT') return { torso: { width: 84, borderWidth: 2 }, arm: { borderWidth: 2 }, leg: { borderWidth: 2 } };
  return { torso: {}, arm: {}, leg: {} };
}

function CardSignature({ card, unlocked }: { card: HeroCardDefinition; unlocked: boolean }) {
  if (!unlocked) return null;
  if (card.visual === 'ORACLE') return <View style={[styles.halo, { borderColor: card.accent }]} />;
  if (card.visual === 'KING') return <View style={styles.crown}>
    <View style={[styles.crownSpike, { backgroundColor: card.accent, transform: [{ rotate: '-20deg' }] }]} />
    <View style={[styles.crownSpike, { backgroundColor: card.accent }]} />
    <View style={[styles.crownSpike, { backgroundColor: card.accent, transform: [{ rotate: '20deg' }] }]} />
  </View>;
  if (card.visual === 'PATHFINDER') return <View style={[styles.compass, { borderColor: card.accent }]} />;
  if (card.visual === 'VOID') return <View style={[styles.voidRing, { borderColor: card.accent }]} />;
  if (card.visual === 'WRAITH') return <View style={[styles.cloak, { borderColor: card.accent }]} />;
  if (card.visual === 'ASCENDANT') return <View style={styles.ascendant}>
    {[0, 45, 90, 135].map(angle => <View key={angle} style={[styles.ray, { backgroundColor: card.accent, transform: [{ rotate: `${angle}deg` }] }]} />)}
  </View>;
  return null;
}

const styles = StyleSheet.create({
  card: { marginTop: 18, borderWidth: 1, borderRadius: 24, backgroundColor: 'rgba(4,13,17,0.94)', overflow: 'hidden', padding: 18 },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -75, top: 60, opacity: 0.8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  rarity: { fontSize: 9, fontWeight: '900', letterSpacing: 2.5 },
  name: { color: C.white, fontSize: 22, fontWeight: '900', marginTop: 5 },
  codename: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  statusBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 7, fontWeight: '900', letterSpacing: 1.3 },
  art: { height: 210, marginTop: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  aura: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 1 },
  head: { position: 'absolute', width: 38, height: 42, borderRadius: 18, top: 34, backgroundColor: '#071419', borderWidth: 1, zIndex: 3 },
  torso: { position: 'absolute', width: 74, height: 92, borderRadius: 28, top: 72, backgroundColor: '#061116', borderWidth: 1 },
  arm: { position: 'absolute', width: 19, height: 98, borderRadius: 11, top: 78, backgroundColor: '#061116', borderWidth: 1, transformOrigin: 'top center' },
  leftArm: { left: '34%', transform: [{ rotate: '11deg' }] },
  rightArm: { right: '34%', transform: [{ rotate: '-11deg' }] },
  leg: { position: 'absolute', width: 23, height: 95, borderRadius: 12, top: 152, backgroundColor: '#061116', borderWidth: 1, transformOrigin: 'top center' },
  leftLeg: { left: '43%', transform: [{ rotate: '5deg' }] },
  rightLeg: { right: '43%', transform: [{ rotate: '-5deg' }] },
  lore: { color: C.textMuted, fontSize: 12, lineHeight: 19, minHeight: 42, marginTop: 6 },
  button: { minHeight: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingHorizontal: 12 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  buttonText: { textAlign: 'center', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  lockShade: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.48)' },
  lock: { color: C.textVeryMuted, fontSize: 42 },
  halo: { position: 'absolute', width: 92, height: 28, borderRadius: 46, borderWidth: 2, top: 22 },
  crown: { position: 'absolute', width: 64, height: 34, top: 17, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  crownSpike: { width: 5, height: 28, borderRadius: 3, opacity: 0.7 },
  compass: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderStyle: 'dashed', opacity: 0.5 },
  voidRing: { position: 'absolute', width: 178, height: 178, borderRadius: 89, borderWidth: 2, opacity: 0.38 },
  cloak: { position: 'absolute', width: 118, height: 164, borderRadius: 60, borderWidth: 1, borderBottomWidth: 3, opacity: 0.36, top: 42 },
  ascendant: { position: 'absolute', width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: 2, height: 160, opacity: 0.32 },
});
