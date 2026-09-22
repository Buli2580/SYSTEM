import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { PlayerProfile } from '../core/types';
import type { AvatarStyle } from '../identity/model';
import { getEvolutionVisual } from '../identity/evolution';

export default function CharacterCard({
  player,
  style = 'CYBER',
  archetype = 'BALANCED ORIGIN',
  onPress,
  compact = false,
}: {
  player: PlayerProfile;
  style?: AvatarStyle;
  archetype?: string;
  onPress?: () => void;
  compact?: boolean;
}) {
  const pulse = useSharedValue(0);
  const rotate = useSharedValue(0);
  const visual = getEvolutionVisual(player.realLevel, player.rank, style);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: visual.pulseMs, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    rotate.value = withRepeat(
      withTiming(1, { duration: 9000 - visual.stage * 800, easing: Easing.linear }),
      -1,
      false,
    );
  }, [pulse, rotate, visual.pulseMs, visual.stage]);

  const auraStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.28, 0.9]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.94, 1.1]) }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 360}deg` }],
  }));

  const Body = onPress ? Pressable : View;
  return (
    <Body
      {...(onPress ? { onPress, accessibilityRole: 'button' as const, accessibilityLabel: 'Otwórz kartę postaci' } : {})}
      style={[styles.card, compact && styles.compactCard, { borderColor: visual.frame }]}
    >
      <View style={[styles.glow, { backgroundColor: visual.auraSoft }]} />
      <View style={[styles.stageBadge, { borderColor: visual.frame }]}>
        <Text style={[styles.stageText, { color: visual.aura }]}>EVOLUTION {visual.stage} // {visual.name}</Text>
      </View>

      <View style={[styles.avatarStage, compact && styles.compactAvatarStage]}>
        <Animated.View style={[styles.aura, auraStyle, { borderColor: visual.aura, shadowColor: visual.aura, shadowRadius: visual.glow }]} />
        <Animated.View style={[styles.ring, ringStyle, { borderColor: visual.frame }]}>
          <View style={[styles.orb, { backgroundColor: visual.aura }]} />
          <View style={[styles.orbTwo, { backgroundColor: visual.aura }]} />
        </Animated.View>
        <View style={[styles.avatarFrame, compact && styles.compactAvatar, { borderColor: visual.frame }]}>
          {player.avatarUri ? (
            <Image source={{ uri: player.avatarUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.empty}>
              <Text style={[styles.glyph, { color: visual.aura }]}>◇</Text>
              <Text style={styles.emptyText}>PLAYER IMAGE</Text>
            </View>
          )}
          <View style={styles.scanOverlay} />
        </View>
      </View>

      <View style={styles.identity}>
        <Text style={styles.name}>{player.displayName}</Text>
        <Text style={[styles.rank, { color: visual.aura }]}>LV. {player.realLevel} // RANGA {player.rank}</Text>
        <Text style={styles.meta}>{archetype} · {style}</Text>
      </View>

      {!compact && (
        <>
          <View style={styles.rule} />
          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.statValue}>{player.realXp}</Text><Text style={styles.statLabel}>REAL XP</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>{player.streak}</Text><Text style={styles.statLabel}>STREAK</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>{player.gameEnergy}</Text><Text style={styles.statLabel}>ENERGIA</Text></View>
          </View>
        </>
      )}
    </Body>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 430,
    borderWidth: 1,
    borderRadius: 30,
    backgroundColor: '#050D11',
    overflow: 'hidden',
    padding: 22,
  },
  compactCard: { minHeight: 270, padding: 14 },
  glow: { position: 'absolute', width: 330, height: 330, borderRadius: 165, opacity: 0.45, alignSelf: 'center', top: 25 },
  stageBadge: { alignSelf: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#04090cdd' },
  stageText: { fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  avatarStage: { height: 255, alignItems: 'center', justifyContent: 'center' },
  compactAvatarStage: { height: 160 },
  aura: { position: 'absolute', width: 218, height: 218, borderRadius: 109, borderWidth: 2, shadowOpacity: 0.9 },
  ring: { position: 'absolute', width: 192, height: 192, borderRadius: 96, borderWidth: 1 },
  orb: { position: 'absolute', width: 8, height: 8, borderRadius: 4, top: -4, left: 92 },
  orbTwo: { position: 'absolute', width: 5, height: 5, borderRadius: 3, bottom: 17, right: 8 },
  avatarFrame: { width: 150, height: 196, borderRadius: 28, overflow: 'hidden', borderWidth: 2, backgroundColor: '#08171d' },
  compactAvatar: { width: 102, height: 128, borderRadius: 20 },
  image: { width: '100%', height: '100%' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 58, fontWeight: '200' },
  emptyText: { color: '#58717b', fontSize: 7, fontWeight: '900', letterSpacing: 2, marginTop: 9 },
  scanOverlay: { position: 'absolute', left: 0, right: 0, top: '49%', height: 1, backgroundColor: '#ffffff33' },
  identity: { alignItems: 'center' },
  name: { color: '#fff', fontWeight: '900', fontSize: 23, letterSpacing: 1 },
  rank: { marginTop: 7, fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  meta: { color: '#6e828b', marginTop: 7, fontSize: 8, fontWeight: '800', letterSpacing: 1.4 },
  rule: { height: 1, backgroundColor: '#16333c', marginVertical: 18 },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#60757e', fontSize: 7, fontWeight: '900', letterSpacing: 1.5, marginTop: 5 },
});
