import { FadeInUp } from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { getPlayerProgressPercent, getSkillProgressPercent, SKILL_KEYS, SKILL_META, SYSTEM_COLORS as C, type PlayerProfile, type SkillKey } from '../core';
import { getAwakeningProgress, getQuest } from '../quests/catalog';
import type { DailyState } from '../storage/daily';
import IdentityAvatar from './IdentityAvatar';
import XpBar from './XpBar';

type Props = {
  player: PlayerProfile;
  completedQuestIds: string[];
  daily: DailyState | null;
  activeQuestId: string | null;
  selectedSkill: SkillKey | null;
  onSelectSkill: (skill: SkillKey) => void;
};

export default function CharacterProgressPanel({
  player,
  completedQuestIds,
  daily,
  activeQuestId,
  selectedSkill,
  onSelectSkill,
}: Props) {
  const awakening = getAwakeningProgress(completedQuestIds);
  const activeQuest = activeQuestId ? getQuest(activeQuestId) : null;
  const realProgress = getPlayerProgressPercent(player) * 100;

  return <View>
    <Animated.View entering={FadeInUp.duration(420)} style={styles.hero}>
      <View style={styles.heroHeader}>
        <View style={styles.identityBlock}>
          <Text style={styles.overline}>PLAYER PROGRESS // ONLINE</Text>
          <Text style={styles.name}>{player.displayName}</Text>
          <Text style={styles.title}>{player.currentTitle ?? 'UNAWAKENED'}</Text>
        </View>
        <IdentityAvatar uri={player.avatarUri} evolution={player.avatarEvolution} size={68} />
        <View style={styles.rankBlock}>
          <Text style={styles.rankLabel}>RANK</Text>
          <Text style={styles.rank}>{player.rank}</Text>
        </View>
      </View>

      <View style={styles.levelRow}>
        <View>
          <Text style={styles.levelLabel}>REAL LEVEL</Text>
          <Text style={styles.level}>{player.realLevel}</Text>
        </View>
        <View style={styles.levelMeta}>
          <Text style={styles.metaLabel}>EVOLUTION</Text>
          <Text style={styles.metaValue}>STAGE {player.avatarEvolution}</Text>
          <Text style={styles.metaLabel}>TOTAL REAL XP</Text>
          <Text style={styles.metaValue}>{player.totalRealXp}</Text>
        </View>
      </View>

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Real XP ${player.realXp} z ${player.realXpToNextLevel}`}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(realProgress) }}
        style={styles.xpSection}
      >
        <XpBar value={player.realXp} max={player.realXpToNextLevel} />
        <View style={styles.xpFooter}>
          <Text style={styles.xpPercent}>{Math.round(realProgress)}% TO NEXT LEVEL</Text>
          <Text style={styles.nextLevel}>NEXT · LV. {player.realLevel + 1}</Text>
        </View>
      </View>
    </Animated.View>

    <View style={styles.metricsRow}>
      <MetricCard label="STREAK" value={String(player.streak)} detail="DAILY CLEAR" delay={70} />
      <MetricCard label="VERIFIED" value={String(player.verifiedQuestCount)} detail="QUESTS" delay={130} />
      <MetricCard label="ENERGY" value={String(player.gameEnergy)} detail="SYSTEM" delay={190} />
    </View>

    <Text style={styles.sectionCode}>REAL ATTRIBUTES // 07</Text>
    <View style={styles.statsGrid}>
      {SKILL_KEYS.map((key, index) => {
        const skill = player.stats[key];
        const progress = getSkillProgressPercent(skill) * 100;
        const selected = selectedSkill === key;
        return <Animated.View key={key} entering={FadeInUp.duration(360).delay(240 + index * 45)} style={styles.statTile}>
          <Pressable onPress={() => onSelectSkill(key)} accessibilityRole="button" accessibilityLabel={`${SKILL_META[key].name}, poziom ${skill.level}`} style={[styles.statCard, selected && styles.statCardSelected]}>
            <Text style={styles.statCode}>{key}</Text>
            <Text style={styles.statLevel}>LV. {skill.level}</Text>
            <Text style={styles.statName}>{SKILL_META[key].name}</Text>
            <View style={styles.statTrack}><View style={[styles.statFill, { width: `${Math.max(3, progress)}%` }]} /></View>
            <Text style={styles.statXp}>{skill.xp} / {skill.xpToNextLevel} XP</Text>
          </Pressable>
        </Animated.View>;
      })}
    </View>

    {selectedSkill && <View style={styles.skillNote}><Text style={styles.note}>{SKILL_META[selectedSkill].description}</Text></View>}

    <Text style={styles.sectionCode}>QUEST STATUS</Text>
    <Animated.View entering={FadeInUp.duration(360).delay(560)} style={styles.questPanel}>
      <View style={styles.questRow}>
        <View><Text style={styles.questLabel}>AWAKENING PROTOCOL</Text><Text style={styles.questValue}>{awakening.completed} / {awakening.total}</Text></View>
        <Text style={styles.questPercent}>{Math.round(awakening.percent)}%</Text>
      </View>
      <View style={styles.questTrack}><View style={[styles.questFill, { width: `${awakening.percent}%` }]} /></View>
      <Text style={styles.questHint}>{activeQuest ? `ACTIVE // ${activeQuest.title}` : daily ? `DAILY PROTOCOL // ${daily.completed} / ${daily.questIds.length}` : 'NO ACTIVE QUEST'}</Text>
      {daily && <Text style={styles.questDetail}>{daily.clear ? 'DAILY CLEAR COMPLETE' : `${daily.questIds.length - daily.completed} DAILY QUESTS REMAINING`} · {daily.weeklyCompleted} THIS WEEK</Text>}
    </Animated.View>
  </View>;
}

function MetricCard({ label, value, detail, delay }: { label: string; value: string; detail: string; delay: number }) {
  return <Animated.View entering={FadeInUp.duration(320).delay(delay)} style={styles.metricCard}>
    <Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricDetail}>{detail}</Text>
  </Animated.View>;
}

const styles = StyleSheet.create({
  hero: { padding: 20, marginTop: 4, backgroundColor: C.panel, borderWidth: 1, borderColor: C.lineBright, borderRadius: 22 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  identityBlock: { flex: 1, minWidth: 0 },
  overline: { color: C.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  name: { color: C.white, fontSize: 27, fontWeight: '900', marginTop: 9 },
  title: { color: C.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  rankBlock: { alignItems: 'flex-end' },
  rankLabel: { color: C.textVeryMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  rank: { color: C.cyan, fontSize: 32, fontWeight: '900', marginTop: 3 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 25 },
  levelLabel: { color: C.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  level: { color: C.white, fontSize: 66, lineHeight: 70, fontWeight: '900' },
  levelMeta: { alignItems: 'flex-end', gap: 6, paddingBottom: 8 },
  metaLabel: { color: C.textVeryMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  metaValue: { color: C.text, fontSize: 13, fontWeight: '900' },
  xpSection: { marginTop: 16 },
  xpFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 },
  xpPercent: { color: C.cyanSoft, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  nextLevel: { color: C.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  metricsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  metricCard: { flex: 1, padding: 12, minHeight: 88, backgroundColor: C.panelSoft, borderWidth: 1, borderColor: C.line, borderRadius: 14 },
  metricValue: { color: C.white, fontSize: 25, fontWeight: '900' },
  metricLabel: { color: C.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 3 },
  metricDetail: { color: C.textVeryMuted, fontSize: 7, fontWeight: '900', letterSpacing: 1, marginTop: 5 },
  sectionCode: { color: C.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginTop: 25, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statTile: { width: '48%' },
  statCard: { minHeight: 100, padding: 12, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 14 },
  statCardSelected: { borderColor: C.cyanSoft, backgroundColor: C.panelSoft },
  statCode: { color: C.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  statLevel: { color: C.white, fontSize: 19, fontWeight: '900', marginTop: 5 },
  statName: { color: C.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  statTrack: { height: 4, backgroundColor: C.line, borderRadius: 4, overflow: 'hidden', marginTop: 9 },
  statFill: { height: '100%', backgroundColor: C.cyan },
  statXp: { color: C.textVeryMuted, fontSize: 8, marginTop: 6 },
  skillNote: { padding: 13, marginTop: 8, backgroundColor: 'rgba(0,229,255,0.05)', borderLeftWidth: 2, borderLeftColor: C.cyan },
  note: { color: C.textMuted, fontSize: 11, lineHeight: 17 },
  questPanel: { padding: 16, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 18 },
  questRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  questLabel: { color: C.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  questValue: { color: C.white, fontSize: 24, fontWeight: '900', marginTop: 4 },
  questPercent: { color: C.cyan, fontSize: 20, fontWeight: '900' },
  questTrack: { height: 5, backgroundColor: C.line, borderRadius: 5, overflow: 'hidden', marginTop: 12 },
  questFill: { height: '100%', backgroundColor: C.cyan },
  questHint: { color: C.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.7, marginTop: 14 },
  questDetail: { color: C.textMuted, fontSize: 10, marginTop: 6 },
});