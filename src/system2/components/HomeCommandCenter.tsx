import { Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { DAILY_RULES } from '../daily/calendar';
import { getPlayerProgressPercent, SYSTEM_COLORS as C } from '../core';
import IdentityAvatar from './IdentityAvatar';
import { titlePl } from '../i18n/pl';
import { getQuest } from '../quests/catalog';
import { getNextAction } from '../quests/nextAction';
import { useSystem } from '../state/SystemProvider';

type CommandTile = {
  key: string;
  label: string;
  value: string;
  detail: string;
  route: '/quests' | '/story' | '/world' | '/social-profile' | '/character';
  alert?: boolean;
  progress?: number;
};

export default function HomeCommandCenter() {
  const router = useRouter();
  const system = useSystem();
  const player = system.player;
  const activeQuest = system.activeQuestId && !system.completedQuestIds.includes(system.activeQuestId) ? getQuest(system.activeQuestId) : undefined;
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
  const systemAlert = system.daily?.clockAnomaly ? 'CLOCK CHECK REQUIRED'
    : system.aiError ? 'AI FALLBACK / RETRY AVAILABLE'
    : system.notificationError ? 'REMINDER SYNC ISSUE'
    : system.achievementError ? 'ACHIEVEMENT SYNC ISSUE'
    : system.awakeningCompleted && !system.daily ? 'DAILY PREPARATION'
    : 'LOCAL CORE READY';
  const aiState = system.aiLoading ? 'AI ANALYZING' : system.aiGameMaster?.source === 'ai' ? 'AI ONLINE' : system.awakeningCompleted ? 'SAFE FALLBACK' : 'SEALED';
  const hasSystemAlert = !!(system.daily?.clockAnomaly || system.aiError || system.notificationError || system.achievementError || (system.awakeningCompleted && !system.daily));
  const repairSystem = () => {
    if (system.aiError && system.awakeningCompleted) { void system.refreshAIGameMaster(); return; }
    if (system.notificationError) { void system.refreshNotifications(); return; }
    if (system.achievementError) { void system.refreshAchievements(); return; }
    void system.refreshPlayer();
  };
  const repairLabel = system.aiError && system.awakeningCompleted ? 'RETRY AI →'
    : system.notificationError ? 'RETRY REMINDER →'
    : system.achievementError ? 'SYNC →'
    : 'REFRESH →';

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
      value: !system.awakeningCompleted ? 'SEALED' : system.daily ? `${dailyDone}/${dailyTotal}` : 'PREP',
      detail: system.daily?.clear ? 'COMPLETE' : system.daily?.clockAnomaly ? 'CHECK CLOCK' : system.daily ? 'TODAY' : 'GENERATING',
      route: '/quests',
      alert: !!system.daily?.clockAnomaly,
      progress: system.awakeningCompleted && !!system.daily ? dailyProgress : undefined,
    },
    {
      key: 'weekly',
      label: 'WEEKLY',
      value: system.daily ? `${weeklyDone}/${DAILY_RULES.weeklyTarget}` : system.awakeningCompleted ? 'PREP' : 'SEALED',
      detail: system.daily?.weeklyClear ? 'COMPLETE' : system.daily ? 'PROTOCOL' : system.awakeningCompleted ? 'WAITING' : 'LOCKED',
      route: '/quests',
      progress: system.awakeningCompleted && !!system.daily ? weeklyProgress : undefined,
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

    <View style={[styles.statusStrip, hasSystemAlert && styles.statusStripAlert]}>
      <View style={styles.statusBody}>
        <Text style={[styles.statusCode, hasSystemAlert && styles.alertText]}>{systemAlert}</Text>
        <Text style={styles.statusMeta}>OFFLINE-FIRST // {aiState}</Text>
      </View>
      {hasSystemAlert && <Pressable accessibilityRole="button" onPress={repairSystem}><Text style={styles.statusAction}>{repairLabel}</Text></Pressable>}
    </View>

    <Pressable accessibilityRole="button" onPress={() => router.push('/character')} style={({pressed})=>[styles.identity,pressed&&styles.pressed]}>
      <IdentityAvatar uri={player.avatarUri} evolution={player.avatarEvolution} size={48} />
      <View style={styles.identityBody}>
        <Text style={styles.identityCode}>PLAYER IDENTITY</Text>
        <Text style={styles.identityName}>{player.displayName}</Text>
        <Text style={styles.identityTitle}>{titlePl(player.currentTitle)}</Text>
      </View>
      <Text style={styles.identityArrow}>CHARACTER →</Text>
    </Pressable>

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
        <Text style={styles.nextCode}>{activeQuest ? 'ACTIVE QUEST // RESUME' : `NEXT ACTION // PRIORITY ${next.priority}`}</Text>
        <Text style={styles.nextArrow}>→</Text>
      </View>
      <Text style={styles.nextTitle}>{activeQuest ? activeQuest.title : next.title}</Text>
      <Text style={styles.nextDetail}>{activeQuest ? 'MISJA W TOKU // WRÓĆ DO WERYFIKACJI I DOKOŃCZ CEL' : next.detail}</Text>
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

  </Animated.View>;
}

const styles = StyleSheet.create({
  root: { marginTop: 14, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: C.lineBright, backgroundColor: 'rgba(4,16,20,0.95)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  code: { color: C.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: C.white, fontSize: 22, fontWeight: '900', marginTop: 5 },
  rank: { borderWidth: 1, borderColor: C.cyanDark, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  rankText: { color: C.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  statusStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.line, borderRadius: 13, backgroundColor: 'rgba(3,12,15,0.7)' },
  statusStripAlert: { borderColor: C.warning, backgroundColor: 'rgba(255,200,87,0.045)' },
  statusBody: { flex: 1 },
  statusCode: { color: C.success, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  statusMeta: { color: C.textVeryMuted, fontSize: 7, fontWeight: '800', marginTop: 3, letterSpacing: 0.8 },
  statusAction: { color: C.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, padding: 12, borderWidth: 1, borderColor: C.line, borderRadius: 16, backgroundColor: C.panel },
  identityBody: { flex: 1 },
  identityCode: { color: C.cyan, fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  identityName: { color: C.white, fontSize: 15, fontWeight: '900', marginTop: 3 },
  identityTitle: { color: C.textMuted, fontSize: 9, fontWeight: '800', marginTop: 2 },
  identityArrow: { color: C.cyan, fontSize: 8, fontWeight: '900' },
  playerRow: { flexDirection: 'row', gap: 15, alignItems: 'center', marginTop: 14 },
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  tile: { width: '31%', flexGrow: 1, minHeight: 76, padding: 11, borderWidth: 1, borderColor: C.line, borderRadius: 14, backgroundColor: C.panel },
  tileAlert: { borderColor: C.warning, backgroundColor: 'rgba(255,200,87,0.055)' },
  tileLabel: { color: C.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  tileValue: { color: C.white, fontSize: 17, fontWeight: '900', marginTop: 7 },
  tileDetail: { color: C.textVeryMuted, fontSize: 8, fontWeight: '900', marginTop: 5 },
  tileTrack: { height: 4, borderRadius: 99, overflow: 'hidden', backgroundColor: C.line, marginTop: 9 },
  tileFill: { height: '100%', borderRadius: 99, backgroundColor: C.cyan },
  alertText: { color: C.warning },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
