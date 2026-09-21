import { Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { DAILY_RULES } from '../daily/calendar';
import { getPlayerProgressPercent, SYSTEM_COLORS as C } from '../core';
import { getQuest } from '../quests/catalog';
import { getNextAction } from '../quests/nextAction';
import { useSystem } from '../state/SystemProvider';

type CommandTile = {
  key: string;
  label: string;
  value: string;
  detail: string;
  route: '/quests' | '/story' | '/world' | '/social-profile';
  alert?: boolean;
  progress?: number;
};

export default function HomeCommandCenter() {
  const router = useRouter();
  const system = useSystem();
  const player = system.player;
  const activeQuest = system.activeQuestId ? getQuest(system.activeQuestId) : undefined;
  const next = getNextAction({
    ...system,
    player,
    completedQuestIds: system.completedQuestIds,
    failedQuestIds: system.failedQuestIds,
    activeQuestId: system.activeQuestId,
    awakeningCompleted: system.awakeningCompleted,
    daily: system.daily,
    story: system.story,
    achievements: system.achievementState,
  });
  const xp = Math.round(getPlayerProgressPercent(player) * 100);
  const dailyDone = system.daily?.completed ?? 0;
  const dailyTotal = system.daily?.questIds.length ?? DAILY_RULES.slots;
  const weeklyDone = Math.min(DAILY_RULES.weeklyTarget, system.daily?.weeklyCompleted ?? 0);
  const bossActive = !!system.story?.worldLinkComplete && !system.story?.bossComplete;
  const bossHp = Math.max(0, system.story?.bossHp ?? 0);
  const dailyProgress = dailyTotal > 0 ? Math.min(100, Math.round(dailyDone / dailyTotal * 100)) : 0;
  const weeklyProgress = Math.min(100, Math.round(weeklyDone / DAILY_RULES.weeklyTarget * 100));
  const energyState = player.gameEnergy <= 20 ? 'LOW' : player.gameEnergy >= 80 ? 'HIGH' : 'READY';

  const openNext = () => {
    if (next.route === '/quest' && next.questId) {
      router.push({ pathname: '/quest', params: { questId: next.questId } });
      return;
    }
    router.push(next.route);
  };

  const tiles: CommandTile[] = [
    {
      key: 'daily',
      label: 'DAILY',
      value: system.awakeningCompleted ? `${dailyDone}/${dailyTotal}` : 'SEALED',
      detail: system.daily?.clear ? 'COMPLETE' : system.daily?.clockAnomaly ? 'CHECK CLOCK' : 'TODAY',
      route: '/quests',
      alert: !!system.daily?.clockAnomaly,
      progress: dailyProgress,
    },
    {
      key: 'weekly',
      label: 'WEEKLY',
      value: `${weeklyDone}/${DAILY_RULES.weeklyTarget}`,
      detail: system.daily?.weeklyClear ? 'COMPLETE' : 'PROTOCOL',
      route: '/quests',
      progress: weeklyProgress,
    },
    {
      key: 'boss',
      label: 'BOSS',
      value: system.story?.bossComplete ? 'DOWN' : bossActive ? (bossHp ? `${bossHp} HP` : 'LIVE') : 'SEALED',
      detail: bossActive ? 'THREAT' : system.story?.bossComplete ? 'DEFEATED' : 'LOCKED',
      route: '/story',
      alert: bossActive,
    },
    {
      key: 'world',
      label: 'WORLD',
      value: system.worldUnlocked ? `${player.discoveredSectors} SECTORS` : 'SEALED',
      detail: system.worldUnlocked ? 'ONLINE' : 'LOCKED',
      route: '/world',
    },
    {
      key: 'social',
      label: 'SOCIAL',
      value: `RANK ${player.rank}`,
      detail: 'NETWORK',
      route: '/social-profile',
    },
  ];

  return <Animated.View entering={FadeInUp.duration(420)} style={styles.root}>
    <View style={styles.header}>
      <View>
        <Text style={styles.code}>HOME 2.0 // COMMAND CENTER</Text>
        <Text style={styles.title}>DZISIAJ W SYSTEMIE</Text>
      </View>
      <View style={styles.rank}><Text style={styles.rankText}>RANK {player.rank}</Text></View>
    </View>

    <View style={styles.playerRow}>
      <View style={styles.levelBlock}>
        <Text style={styles.meta}>REAL LEVEL</Text>
        <Text style={styles.level}>{player.realLevel}</Text>
      </View>
      <View style={styles.xpBlock}>
        <View style={styles.xpHeader}>
          <Text style={styles.meta}>REAL XP</Text>
          <Text style={styles.xpValue}>{player.realXp} / {player.realXpToNextLevel}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(2, Math.min(100, xp))}%` as DimensionValue }]} />
        </View>
        <View style={styles.quickRow}>
          <View><Text style={styles.quickLabel}>ENERGY // {energyState}</Text><Text style={styles.quickValue}>{player.gameEnergy}</Text></View>
          <View style={styles.quickRight}><Text style={styles.quickLabel}>STREAK</Text><Text style={styles.quickValue}>{player.streak} DAYS</Text></View>
        </View>
      </View>
    </View>

    <Pressable accessibilityRole="button" onPress={openNext}
      style={({ pressed }) => [styles.next, pressed && styles.pressed]}>
      <View style={styles.nextTop}>
        <Text style={styles.nextCode}>NEXT ACTION // PRIORITY {next.priority}</Text>
        <Text style={styles.nextArrow}>→</Text>
      </View>
      <Text style={styles.nextTitle}>{next.title}</Text>
      <Text style={styles.nextDetail}>{activeQuest ? `ACTIVE // ${activeQuest.title}` : next.detail}</Text>
    </Pressable>

    <View style={styles.grid}>
      {tiles.map(tile => <Pressable key={tile.key} accessibilityRole="button" onPress={() => router.push(tile.route)}
        style={({ pressed }) => [styles.tile, tile.alert && styles.tileAlert, pressed && styles.pressed]}>
        <Text style={[styles.tileLabel, tile.alert && styles.alertText]}>{tile.label}</Text>
        <Text style={styles.tileValue}>{tile.value}</Text>
        <Text style={[styles.tileDetail, tile.alert && styles.alertText]}>{tile.detail}</Text>
        {tile.progress !== undefined && <View style={styles.tileTrack}><View style={[styles.tileFill,{width:`${Math.max(2,tile.progress)}%` as DimensionValue}]} /></View>}
      </Pressable>)}
    </View>

    {activeQuest && <View style={styles.active}>
      <View style={styles.activeDot} />
      <View style={styles.activeBody}>
        <Text style={styles.activeCode}>ACTIVE QUEST</Text>
        <Text style={styles.activeTitle}>{activeQuest.title}</Text>
      </View>
      <Pressable onPress={() => router.push({ pathname: '/quest', params: { questId: activeQuest.id } })}>
        <Text style={styles.resume}>RESUME →</Text>
      </Pressable>
    </View>}
  </Animated.View>;
}

const styles = StyleSheet.create({
  root: { marginTop: 14, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: C.lineBright, backgroundColor: 'rgba(4,16,20,0.95)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  code: { color: C.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: C.white, fontSize: 22, fontWeight: '900', marginTop: 5 },
  rank: { borderWidth: 1, borderColor: C.cyanDark, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  rankText: { color: C.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  playerRow: { flexDirection: 'row', gap: 15, alignItems: 'center', marginTop: 18 },
  levelBlock: { width: 82, minHeight: 88, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 16, backgroundColor: C.panel },
  meta: { color: C.textVeryMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  level: { color: C.white, fontSize: 37, lineHeight: 41, fontWeight: '900', marginTop: 2 },
  xpBlock: { flex: 1 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  xpValue: { color: C.text, fontSize: 9, fontWeight: '900' },
  track: { height: 7, borderRadius: 999, overflow: 'hidden', backgroundColor: C.line, marginTop: 8 },
  fill: { height: '100%', backgroundColor: C.cyan },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 11 },
  quickRight: { alignItems: 'flex-end' },
  quickLabel: { color: C.textVeryMuted, fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  quickValue: { color: C.text, fontSize: 10, fontWeight: '900', marginTop: 2 },
  next: { marginTop: 18, padding: 16, borderWidth: 1, borderColor: C.cyanDark, borderRadius: 17, backgroundColor: 'rgba(0,229,255,0.055)' },
  nextTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextCode: { color: C.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  nextArrow: { color: C.cyan, fontSize: 25, fontWeight: '900' },
  nextTitle: { color: C.white, fontSize: 18, fontWeight: '900', marginTop: 5 },
  nextDetail: { color: C.textMuted, fontSize: 10, lineHeight: 15, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tile: { width: '48%', flexGrow: 1, minHeight: 88, padding: 13, borderWidth: 1, borderColor: C.line, borderRadius: 15, backgroundColor: C.panel },
  tileAlert: { borderColor: C.warning, backgroundColor: 'rgba(255,200,87,0.055)' },
  tileLabel: { color: C.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  tileValue: { color: C.white, fontSize: 17, fontWeight: '900', marginTop: 7 },
  tileDetail: { color: C.textVeryMuted, fontSize: 8, fontWeight: '900', marginTop: 5 },
  tileTrack: { height: 4, borderRadius: 99, overflow: 'hidden', backgroundColor: C.line, marginTop: 9 },
  tileFill: { height: '100%', borderRadius: 99, backgroundColor: C.cyan },
  alertText: { color: C.warning },
  active: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 13, borderTopWidth: 1, borderTopColor: C.line },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  activeBody: { flex: 1 },
  activeCode: { color: C.success, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  activeTitle: { color: C.white, fontSize: 11, fontWeight: '900', marginTop: 3 },
  resume: { color: C.cyan, fontSize: 9, fontWeight: '900' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
