import {ART} from '../visual/assets';
import {ArtBackdrop} from '../components/VisualArt';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import BottomNavigation from '../components/BottomNavigation';
import IdentityAvatar from '../components/IdentityAvatar';
import SystemError from '../components/SystemError';
import SystemScreen from '../components/SystemScreen';
import { getPlayerProgressPercent, SYSTEM_COLORS } from '../core';
import { AWAKENING_QUESTS, AWAKENING_REWARD_XP, getAwakeningProgress, getQuestStatus } from '../quests/catalog';
import { useSystem } from '../state/SystemProvider';
import { mainStoryObjective } from '../story/selectors';
import { directNextMission } from '../gameMaster/director';
import { playSceneMusic, stopMusic } from '../identity/audio';

const CYAN = '#6CEEFF';
const SKY = '#071017';
const VIOLET = '#765CFF';
const GOLD = '#FFC45B';

function Rain({ reduced }: { reduced: boolean }) {
  const rain = useSharedValue(0);
  useFocusEffect(useCallback(() => {
    if (reduced) return;
    rain.value = withRepeat(withTiming(1, { duration: 1050, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rain);
  }, [rain, reduced]));
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(rain.value, [0, 1], [-70, 190]) }],
    opacity: reduced ? 0.12 : 0.34,
  }));
  return <Animated.View pointerEvents="none" style={[styles.rainLayer, style]}>
    {Array.from({ length: reduced ? 8 : 22 }).map((_, i) => (
      <View key={i} style={[styles.rainDrop, { left: `${(i * 47) % 100}%`, top: (i * 31) % 150, height: 18 + (i % 4) * 8 }]} />
    ))}
  </Animated.View>;
}

function WorldScene({ reduced, bossActive, mode }: { reduced: boolean; bossActive: boolean; mode: 'HOME' | 'QUEST' | 'BOSS' | 'AWAKENING' | 'VICTORY' }) {
  const drift = useSharedValue(0), portal = useSharedValue(0), flash = useSharedValue(0);
  const smoke = useSharedValue(0), threat = useSharedValue(0), particles = useSharedValue(0), fire = useSharedValue(0);

  useFocusEffect(useCallback(() => {
    drift.value = withRepeat(withTiming(1,{duration:9000,easing:Easing.inOut(Easing.ease)}),-1,true);
    portal.value = withRepeat(withTiming(1,{duration:2100,easing:Easing.inOut(Easing.ease)}),-1,true);
    if (!reduced) {
      flash.value = withRepeat(withTiming(1,{duration:7600,easing:Easing.linear}),-1,false);
      smoke.value = withRepeat(withTiming(1,{duration:7000,easing:Easing.inOut(Easing.ease)}),-1,true);
      threat.value = withRepeat(withTiming(1,{duration:4200,easing:Easing.inOut(Easing.ease)}),-1,true);
      particles.value = withRepeat(withTiming(1,{duration:2600,easing:Easing.linear}),-1,false);
      fire.value = withRepeat(withTiming(1,{duration:650,easing:Easing.inOut(Easing.ease)}),-1,true);
    }
    return () => [drift,portal,flash,smoke,threat,particles,fire].forEach(cancelAnimation);
  },[drift,portal,flash,smoke,threat,particles,fire,reduced]));

  const far=useAnimatedStyle(()=>({transform:[{translateX:interpolate(drift.value,[0,1],[-5,5])},{translateY:bossActive?interpolate(flash.value,[0,.88,.9,1],[0,-3,3,0]):0}]}));
  const mid=useAnimatedStyle(()=>({transform:[{translateX:interpolate(drift.value,[0,1],[8,-8])}]}));
  const portalStyle=useAnimatedStyle(()=>({transform:[{scale:interpolate(portal.value,[0,1],[.94,1.06])},{rotate:`${interpolate(portal.value,[0,1],[-3,3])}deg`}],opacity:interpolate(portal.value,[0,1],[.58,.95])}));
  const lightning=useAnimatedStyle(()=>({opacity:reduced?0:interpolate(flash.value,[0,.86,.88,.9,1],[0,0,.42,0,0])}));
  const smokeStyle=useAnimatedStyle(()=>({transform:[{translateX:interpolate(smoke.value,[0,1],[-14,14])}],opacity:interpolate(smoke.value,[0,1],[.18,.3])}));
  const threatStyle=useAnimatedStyle(()=>({transform:[{translateX:interpolate(threat.value,[0,1],[-6,6])},{translateY:interpolate(threat.value,[0,1],[0,-3])}]}));
  const particleStyle=useAnimatedStyle(()=>({transform:[{translateY:interpolate(particles.value,[0,1],[20,-48])}],opacity:interpolate(particles.value,[0,.8,1],[0,1,0])}));
  const fireStyle=useAnimatedStyle(()=>({opacity:interpolate(fire.value,[0,1],[.28,.7]),transform:[{scaleY:interpolate(fire.value,[0,1],[.82,1.1])}]}));

  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[StyleSheet.absoluteFill,styles.sky,mode==='BOSS'&&styles.sceneBoss,mode==='AWAKENING'&&styles.sceneAwakening,mode==='VICTORY'&&styles.sceneVictory,mode==='QUEST'&&styles.sceneQuest]} />
    <ArtBackdrop source={ART.home}/>
    <View style={styles.cityGlow}/>
    <Animated.View style={[styles.farCity,far]}>{[96,145,118,188,126,164,105,210,138].map((height,i)=><View key={i} style={[styles.farTower,{height,left:i*48-16}]}>{!reduced&&<View style={[styles.windowBand,{top:18+(i%4)*13}]}/>}</View>)}</Animated.View>
    <View style={styles.horizonFog}/>
    {!reduced&&<Animated.View style={[styles.smokeBank,smokeStyle]}><View style={styles.smokeCloud}/><View style={[styles.smokeCloud,{left:90,top:18}]}/><View style={[styles.smokeCloud,{left:190,top:-8}]}/></Animated.View>}
    {!reduced&&<Animated.View style={[styles.backgroundCreature,threatStyle]}><View style={styles.creatureHead}/><View style={styles.creatureBody}/><View style={styles.creatureEye}/></Animated.View>}
    <Animated.View style={[styles.midCity,mid]}><View style={[styles.modernBlock,{left:-32,height:270,width:128}]}/><View style={[styles.modernBlock,{right:-42,height:315,width:148}]}/><View style={[styles.modernBlock,{right:98,height:185,width:82,opacity:.55}]}/><View style={styles.streetLight}><View style={styles.streetLamp}/></View></Animated.View>
    <View style={styles.portalAnchor}><Animated.View style={[styles.portalGlow,portalStyle]}/><Animated.View style={[styles.portalRing,portalStyle]}/><Animated.View style={[styles.portalEnergy,portalStyle]}/><View style={styles.portalCore}/></View>
    {bossActive&&<View style={styles.bossSilhouette}><View style={styles.bossHornLeft}/><View style={styles.bossHornRight}/><View style={styles.bossHead}><View style={styles.bossEye}/><View style={[styles.bossEye,{right:13,left:undefined}]}/></View><View style={styles.bossBody}/></View>}
    {!reduced&&Array.from({length:12}).map((_,i)=><Animated.View key={i} style={[styles.systemParticle,particleStyle,{left:`${8+((i*19)%84)}%`,bottom:110+(i*43)%260}]}/>)}
    <Rain reduced={reduced}/>
    <Animated.View style={[StyleSheet.absoluteFill,styles.lightning,lightning]}/>
    <View style={styles.foregroundFog}/><View style={styles.ground}/>
    {!reduced&&<><Animated.View style={[styles.fireSource,styles.fireSourceLeft,fireStyle]}/><Animated.View style={[styles.fireSource,styles.fireSourceRight,fireStyle]}/></>}
    {mode==='VICTORY'&&<View style={styles.victoryLight}/>}
  </View>;
}
function PlayerHero() {
  const { player } = useSystem();
  const breathe = useSharedValue(0);
  useFocusEffect(useCallback(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(breathe);
  }, [breathe]));
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(breathe.value, [0, 1], [1, -4]) }, { scale: interpolate(breathe.value, [0, 1], [1, 1.012]) }] }));

  return <Animated.View pointerEvents="none" style={[styles.playerHero, style]}>
    <View style={styles.playerAura} />
    <View style={styles.playerHead}>
      {player.avatarUri ? <IdentityAvatar uri={player.avatarUri} evolution={player.avatarEvolution} size={82} /> : <View style={styles.faceless}><View style={styles.eyeLine} /></View>}
    </View>
    <View style={styles.playerShoulders} />
    <View style={styles.playerBody}><View style={styles.chestCore} /></View>
    <View style={styles.playerLegLeft} /><View style={styles.playerLegRight} />
  </Animated.View>;
}

function Hud({ top }: { top: number }) {
  const { player } = useSystem();
  const xp = getPlayerProgressPercent(player) * 100;
  return <View pointerEvents="box-none" style={[styles.hud, { top: top + 8 }]}>
    <View style={styles.levelHud}>
      <Text style={styles.levelMicro}>LEVEL</Text>
      <Text style={styles.levelValue}>{player.realLevel}</Text>
      <View style={styles.xpTrack}><View style={[styles.xpFill, { width: `${Math.max(2, xp)}%` }]} /></View>
      <Text style={styles.xpText}>{player.realXp} / {player.realXpToNextLevel} XP</Text>
    </View>
    <View style={styles.hudRight}>
      <View style={styles.hudPill}><Text style={styles.hudIcon}>ϟ</Text><Text style={styles.hudValue}>{player.gameEnergy}</Text><Text style={styles.hudLabel}>ENERGY</Text></View>
      <View style={styles.hudPill}><Text style={[styles.hudIcon, { color: GOLD }]}>🔥</Text><Text style={styles.hudValue}>{player.streak}</Text><Text style={styles.hudLabel}>STREAK</Text></View>
    </View>
  </View>;
}

function WorldNode({ label, sub, style, onPress, locked = false }: { label: string; sub: string; style: object; onPress: () => void; locked?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={locked} onPress={onPress} style={({ pressed }) => [styles.worldNode, style, locked && styles.nodeLocked, pressed && styles.nodePressed]}>
    <View style={styles.nodeBeacon}><View style={styles.nodeDot} /></View>
    <Text style={styles.nodeLabel}>{label}</Text>
    <Text style={styles.nodeSub}>{sub}</Text>
  </Pressable>;
}

export default function SystemHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const {
    adaptivePlan, adaptiveModel, player, ready, completedQuestIds, awakeningCompleted, worldUnlocked,
    activeQuestId, error, refreshPlayer, daily, story, lastReward, dismissLastReward, gameMasterProfile, recentAttempt, recentAttempts, settings, latestRaidVictory, socialSignal,
  } = useSystem();

  const autoPerformanceMode: 'LOW'|'MEDIUM'|'HIGH' = width < 370 || height < 700 ? 'LOW' : width < 430 || height < 800 ? 'MEDIUM' : 'HIGH';
  const performanceMode = settings.performanceMode ?? autoPerformanceMode;
  const reduced = performanceMode === 'LOW';
  const bossActive = !story?.bossComplete && awakeningCompleted;
  const sceneMode: 'HOME' | 'QUEST' | 'BOSS' | 'AWAKENING' | 'VICTORY' =
    lastReward || latestRaidVictory ? 'VICTORY' :
    activeQuestId ? 'QUEST' :
    bossActive ? 'BOSS' :
    !awakeningCompleted ? 'AWAKENING' : 'HOME';
  const worldTier = player.realLevel >= 25 ? 3 : player.realLevel >= 10 ? 2 : 1;
  const streakTier = player.streak >= 30 ? 3 : player.streak >= 7 ? 2 : player.streak >= 3 ? 1 : 0;
  const awakening = getAwakeningProgress(completedQuestIds);
  const objective = mainStoryObjective(story, awakeningCompleted);
  const gameMaster = directNextMission({adaptivePlan,adaptiveModel,player,daily,story,completedQuestIds,activeQuestId,awakeningCompleted,gameMasterProfile,recentAttempt,recentAttempts,socialSignal});
  const progress = awakeningCompleted ? objective.completed : awakening.completed;
  const total = awakeningCompleted ? objective.total : awakening.total;
  const percent = total ? Math.min(100, progress / total * 100) : 0;
  const nextQuest = AWAKENING_QUESTS.find(q => {
    const s = getQuestStatus(q.id, completedQuestIds, activeQuestId);
    return s === 'ACTIVE' || s === 'AVAILABLE';
  });
  const directedQuest = gameMaster.quest ?? (!awakeningCompleted ? nextQuest : undefined);
  const active = directedQuest
    ? { title: directedQuest.title, subtitle: gameMaster.message, action: activeQuestId === directedQuest.id ? 'CONTINUE' : 'START', route: { pathname: '/quest' as const, params: { questId: directedQuest.id } } }
    : { title: objective.title, subtitle: objective.subtitle, action: 'CONTINUE', route: '/story' as const };
  useFocusEffect(useCallback(() => { playSceneMusic(sceneMode); return stopMusic; }, [sceneMode]));
  useEffect(() => {
    if (!lastReward) return;
    const timer = setTimeout(dismissLastReward, 4200);
    return () => clearTimeout(timer);
  }, [lastReward, dismissLastReward]);

  const weeklyTarget = daily?.weeklyTarget ?? 5;
  const weekly = Math.min(weeklyTarget, daily?.weeklyCompleted ?? 0);
  const dailyDone = daily?.completed ?? 0;

  if (!ready) return <View style={styles.loadingRoot}>
    <Text style={styles.loadingSmall}>{error ? 'SYSTEM // BŁĄD ZAPISU' : 'SYSTEM // INITIALIZING'}</Text>
    <Text style={styles.loadingTitle}>AWAKENING</Text>
    {error && <SystemError message={error} retry={() => { void refreshPlayer(); }} />}
  </View>;

  return <SystemScreen style={styles.root}>
    <View style={styles.scene}>
      <WorldScene reduced={reduced} bossActive={bossActive} mode={sceneMode} />
      {sceneMode==='VICTORY' && (lastReward || latestRaidVictory) && <View pointerEvents="none" style={styles.victoryBanner}>
        <Text style={styles.victoryEyebrow}>{lastReward?'QUEST COMPLETE // VERIFIED':'RAID BOSS DEFEATED // VERIFIED'}</Text>
        <Text style={styles.victoryTitle}>VICTORY</Text>
        <Text style={styles.victoryReward}>+{lastReward?.realXp ?? latestRaidVictory?.reward?.xp ?? 0} XP</Text>
        {lastReward && lastReward.afterLevel>lastReward.beforeLevel && <Text style={styles.victoryEvolution}>LEVEL {lastReward.beforeLevel} → {lastReward.afterLevel}</Text>}
        {lastReward && lastReward.afterRank!==lastReward.beforeRank && <Text style={styles.victoryEvolution}>RANK {lastReward.beforeRank} → {lastReward.afterRank}</Text>}
        {lastReward && !!lastReward.newTitles.length && <Text style={styles.victoryEvolution}>NEW TITLE // {lastReward.newTitles[0]}</Text>}
        {lastReward && lastReward.worldUnlocked && <Text style={styles.victoryEvolution}>WORLD GATE // UNLOCKED</Text>}
      </View>}
      <View pointerEvents="none" style={[styles.progressAtmosphere, worldTier >= 2 && styles.progressAtmosphereMid, worldTier >= 3 && styles.progressAtmosphereHigh]} />
      {streakTier > 0 && <View pointerEvents="none" style={[styles.streakAura, streakTier >= 2 && styles.streakAuraStrong, streakTier >= 3 && styles.streakAuraMax]} />}
      <Hud top={insets.top} />

      <Pressable accessibilityRole="button" accessibilityLabel="Otwórz SYSTEM WORLD" disabled={!worldUnlocked} onPress={() => router.push('/world')} style={styles.portalTouch}>
        <Text style={styles.portalLabel}>{worldUnlocked ? 'WORLD GATE' : 'WORLD LOCKED'}</Text>
      </Pressable>

      <WorldNode label="DAILY" sub={`${dailyDone}/${daily?.questIds.length ?? 0} · SIGNAL`} style={styles.dailyNode} onPress={() => router.push('/quests')} />
      <WorldNode label="WEEKLY" sub={`${weekly}/${weeklyTarget} · PROTOCOL`} style={styles.weeklyNode} onPress={() => router.push('/quests')} />
      <WorldNode label="BOSS" sub={story?.bossComplete ? 'CLEARED' : bossActive ? 'ANOMALY' : 'DORMANT'} style={styles.bossNode} onPress={() => router.push('/story')} locked={!awakeningCompleted} />

      <PlayerHero />
      <View pointerEvents="none" style={styles.systemWindowLeft}>
        <Text style={styles.systemWindowCode}>SYSTEM // STATUS</Text>
        <Text style={styles.systemWindowTitle}>RANK {player.rank}</Text>
        <Text style={styles.systemWindowMeta}>EVOLUTION {player.avatarEvolution} · VERIFIED {player.verifiedQuestCount}</Text>
      </View>
      <View pointerEvents="none" style={styles.systemWindowRight}>
        <Text style={styles.systemWindowCode}>{bossActive ? 'WARNING // ANOMALY' : 'WORLD // SIGNAL'}</Text>
        <Text style={[styles.systemWindowTitle, bossActive && styles.warningText]}>{bossActive ? 'BOSS DETECTED' : worldUnlocked ? 'GATE STABLE' : 'GATE LOCKED'}</Text>
        <Text style={styles.systemWindowMeta}>{bossActive ? 'THREAT RESPONSE AVAILABLE' : 'REALITY LAYER SYNCHRONIZED'}</Text>
      </View>

      <View style={[styles.questCallout, { bottom: Math.max(insets.bottom + 82, 94) }]}>
        <Text style={styles.questEyebrow}>ACTIVE QUEST // {active.subtitle}</Text>
        <Text numberOfLines={2} style={styles.questTitle}>{active.title}</Text>
        <View style={styles.questProgressRow}>
          <View style={styles.questProgressTrack}><View style={[styles.questProgressFill, { width: `${Math.max(2, percent)}%` }]} /></View>
          <Text style={styles.questProgressText}>{progress}/{total}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push(active.route as never)} style={({ pressed }) => [styles.questAction, pressed && styles.questActionPressed]}>
          <Text style={styles.questActionText}>{active.action} MISSION</Text>
          <Text style={styles.questReward}>+{awakeningCompleted ? objective.reward : AWAKENING_REWARD_XP} XP  →</Text>
        </Pressable>
      </View>

      <View pointerEvents="none" style={styles.worldState}>
        <Text style={styles.worldStateText}>SYSTEM // {sceneMode}</Text>
        <Text style={styles.playerName}>{player.displayName} · {player.currentTitle}</Text>
        <Text style={styles.performanceText}>FX {performanceMode} · AUTO</Text>
      </View>
    </View>
    <BottomNavigation />
  </SystemScreen>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020508' },
  scene: { flex: 1, overflow: 'hidden', backgroundColor: SKY },
  sceneBoss: { backgroundColor: '#14090D' },
  sceneAwakening: { backgroundColor: '#08101A' },
  sceneVictory: { backgroundColor: '#0B1714' },
  sceneQuest: { backgroundColor: '#06131A' },
  modernBlock: { position: 'absolute', backgroundColor: '#09141D', borderTopWidth: 1, borderColor: '#17323D' },
  streetLight: { position: 'absolute', width: 4, backgroundColor: '#13252D' },
  streetLamp: { position: 'absolute', top: 0, width: 16, height: 3, backgroundColor: '#6CEEFF' },
  performanceText:{color:'rgba(108,238,255,.38)',fontSize:6,fontWeight:'900',letterSpacing:1.2,marginTop:2},
  sky: { backgroundColor: '#050A10' },
  cityGlow: { position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(62,76,180,.10)', top: -140, right: -110 },
  farCity: { position: 'absolute', left: -20, right: -20, top: '16%', height: 180, opacity: .56 },
  farTower: { position: 'absolute', bottom: 0, width: 38, backgroundColor: '#091219', borderTopWidth: 1, borderColor: '#17323D', overflow: 'hidden' },
  windowBand: { position: 'absolute', left: 6, right: 6, height: 2, backgroundColor: 'rgba(108,238,255,.18)' },
  depthVeil:{position:'absolute',left:-30,right:-30,top:'18%',bottom:'22%',borderTopWidth:1,borderBottomWidth:1,borderColor:'rgba(98,239,255,.035)',backgroundColor:'rgba(4,12,20,.10)'},
  lightningWash:{position:'absolute',inset:0,backgroundColor:'rgba(190,220,255,.55)'},rainField:{position:'absolute',inset:-40,overflow:'hidden'},
  smokeBank:{position:'absolute',left:-40,right:-40,bottom:'29%',height:100},smokeCloud:{position:'absolute',left:10,top:10,width:150,height:65,borderRadius:80,backgroundColor:'rgba(100,125,145,.18)'},backgroundCreature:{position:'absolute',right:'13%',bottom:'32%',width:46,height:90,opacity:.34},creatureHead:{position:'absolute',top:0,left:11,width:25,height:25,borderRadius:13,backgroundColor:'#020609'},creatureBody:{position:'absolute',top:20,left:4,width:38,height:70,borderTopLeftRadius:18,borderTopRightRadius:18,backgroundColor:'#020609'},creatureEye:{position:'absolute',top:10,left:21,width:4,height:3,borderRadius:2,backgroundColor:'#765CFF',shadowColor:'#765CFF',shadowOpacity:1,shadowRadius:7},
  horizonFog: { position: 'absolute', left: 0, right: 0, top: '34%', height: 150, backgroundColor: 'rgba(79,116,125,.08)' },
  midCity: { position: 'absolute', left: 0, right: 0, top: '25%', height: 320 },
  ruin: { position: 'absolute', bottom: 0, backgroundColor: '#071015', borderWidth: 1, borderColor: '#13252D', transform: [{ rotate: '-2deg' }] },
  ruinBroken: { transform: [{ rotate: '4deg' }] },
  portalAnchor: { position: 'absolute', width: 150, height: 210, right: 18, top: '29%', alignItems: 'center', justifyContent: 'center' },
  portalGlow: { position: 'absolute', width: 140, height: 205, borderRadius: 75, backgroundColor: 'rgba(45,220,255,.10)', shadowColor: CYAN, shadowOpacity: .7, shadowRadius: 28 },
  portalRing: { width: 105, height: 178, borderRadius: 55, borderWidth: 4, borderColor: 'rgba(108,238,255,.7)' },
  portalEnergy:{position:'absolute',width:88,height:128,borderRadius:50,borderWidth:2,borderColor:'rgba(118,92,255,.58)',backgroundColor:'rgba(80,45,210,.10)',shadowColor:'#765CFF',shadowOpacity:.9,shadowRadius:28},
  portalCore: { position: 'absolute', width: 82, height: 148, borderRadius: 44, backgroundColor: 'rgba(5,72,92,.48)' },
  portalTouch: { position: 'absolute', right: 15, top: '29%', width: 155, height: 220, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },
  portalLabel: { color: CYAN, fontSize: 8, fontWeight: '900', letterSpacing: 2.2, backgroundColor: 'rgba(2,7,10,.72)', paddingHorizontal: 9, paddingVertical: 5 },
  progressAtmosphere: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,40,65,.015)' },
  progressAtmosphereMid: { backgroundColor: 'rgba(56,72,150,.025)' },
  progressAtmosphereHigh: { backgroundColor: 'rgba(80,52,180,.035)' },
  streakAura: { position: 'absolute', alignSelf: 'center', top: '22%', width: 260, height: 410, borderRadius: 140, borderWidth: 1, borderColor: 'rgba(108,238,255,.08)' },
  streakAuraStrong: { borderColor: 'rgba(118,92,255,.16)', shadowColor: VIOLET, shadowOpacity: .22, shadowRadius: 30 },
  streakAuraMax: { borderWidth: 2, borderColor: 'rgba(108,238,255,.24)', shadowOpacity: .42, shadowRadius: 42 },
  bossSilhouette: { position: 'absolute', left: 30, top: '30%', width: 105, height: 230, opacity: .82, alignItems: 'center' },
  bossHead: { width: 58, height: 55, borderRadius: 25, backgroundColor: '#020304', marginTop: 18 },
  bossBody: { width: 102, height: 170, borderTopLeftRadius: 45, borderTopRightRadius: 45, backgroundColor: '#020304', marginTop: -4 },
  bossHornLeft: { position: 'absolute', top: 0, left: 14, width: 7, height: 45, backgroundColor: '#020304', transform: [{ rotate: '-28deg' }] },
  bossHornRight: { position: 'absolute', top: 0, right: 14, width: 7, height: 45, backgroundColor: '#020304', transform: [{ rotate: '28deg' }] },
  bossEye: { position: 'absolute', top: 24, left: 13, width: 9, height: 3, backgroundColor: '#FF3B35', shadowColor: '#FF3B35', shadowOpacity: 1, shadowRadius: 7 },
  systemParticle: { position: 'absolute', width: 3, height: 10, borderRadius: 2, backgroundColor: VIOLET, opacity: .5, shadowColor: CYAN, shadowOpacity: .8, shadowRadius: 6 },
  rainLayer: { position: 'absolute', left: 0, right: 0, top: -120, height: 420 },
  rainDrop: { position: 'absolute', width: 1, backgroundColor: 'rgba(160,220,235,.62)', transform: [{ rotate: '12deg' }] },
  lightning: { backgroundColor: 'rgba(190,235,255,.18)' },
  foregroundFog: { position: 'absolute', left: -50, right: -50, bottom: 80, height: 180, backgroundColor: 'rgba(75,102,108,.07)', transform: [{ rotate: '-3deg' }] },
  fireSource:{position:'absolute',bottom:'18%',width:34,height:58,borderRadius:22,backgroundColor:'rgba(255,92,35,.42)',shadowColor:'#FF6A2A',shadowOpacity:.9,shadowRadius:24},fireSourceLeft:{left:'9%'},fireSourceRight:{right:'8%',bottom:'22%'},victoryBanner:{position:'absolute',top:'23%',alignSelf:'center',zIndex:18,alignItems:'center',paddingHorizontal:24,paddingVertical:14,borderTopWidth:1,borderBottomWidth:1,borderColor:'rgba(255,196,91,.65)',backgroundColor:'rgba(5,10,16,.76)'},victoryEyebrow:{color:'#FFC45B',fontSize:7,fontWeight:'900',letterSpacing:2},victoryTitle:{color:'#fff',fontSize:32,fontWeight:'900',letterSpacing:5,textShadowColor:'#FFC45B',textShadowRadius:18},victoryReward:{color:'#6CEEFF',fontSize:10,fontWeight:'900',letterSpacing:1.4,marginTop:4},victoryEvolution:{color:'#FFC45B',fontSize:8,fontWeight:'900',letterSpacing:1.2,marginTop:3},
  victoryLight:{position:'absolute',alignSelf:'center',top:'8%',width:320,height:520,borderRadius:180,backgroundColor:'rgba(255,205,100,.18)',shadowColor:'#FFD06A',shadowOpacity:.8,shadowRadius:50},
  ground: { position: 'absolute', left: -50, right: -50, bottom: -80, height: 260, backgroundColor: '#030607', transform: [{ rotate: '-2deg' }], borderTopWidth: 1, borderTopColor: '#17262B' },
  playerHero: { position: 'absolute', alignSelf: 'center', top: '26%', width: 190, height: 360, alignItems: 'center' },
  playerAura: { position: 'absolute', top: 20, width: 190, height: 290, borderRadius: 100, backgroundColor: 'rgba(22,183,215,.055)', shadowColor: CYAN, shadowOpacity: .28, shadowRadius: 28 },
  playerHead: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#071116', borderWidth: 2, borderColor: '#284650', alignItems: 'center', justifyContent: 'center', zIndex: 5, overflow: 'hidden' },
  faceless: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0B171C', alignItems: 'center', justifyContent: 'center' },
  eyeLine: { width: 38, height: 2, backgroundColor: CYAN, shadowColor: CYAN, shadowOpacity: 1, shadowRadius: 8 },
  playerShoulders: { marginTop: -6, width: 168, height: 65, borderTopLeftRadius: 70, borderTopRightRadius: 70, backgroundColor: '#081116', borderWidth: 1, borderColor: '#213740' },
  playerBody: { marginTop: -32, width: 116, height: 170, backgroundColor: '#070E12', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#1D343D', alignItems: 'center', paddingTop: 54 },
  chestCore: { width: 18, height: 18, borderWidth: 2, borderColor: CYAN, transform: [{ rotate: '45deg' }], shadowColor: CYAN, shadowOpacity: .8, shadowRadius: 9 },
  playerLegLeft: { position: 'absolute', bottom: 0, left: 57, width: 34, height: 105, backgroundColor: '#050A0D', transform: [{ rotate: '2deg' }] },
  playerLegRight: { position: 'absolute', bottom: 0, right: 57, width: 34, height: 105, backgroundColor: '#050A0D', transform: [{ rotate: '-2deg' }] },
  hud: { position: 'absolute', left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', zIndex: 20 },
  levelHud: { width: 168, paddingTop: 4 },
  levelMicro: { color: 'rgba(220,245,250,.62)', fontSize: 8, fontWeight: '900', letterSpacing: 2.4 },
  levelValue: { color: '#FFF', fontSize: 38, lineHeight: 40, fontWeight: '900' },
  xpTrack: { width: 150, height: 4, borderRadius: 3, backgroundColor: 'rgba(108,238,255,.13)', overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: CYAN },
  xpText: { color: CYAN, fontSize: 7, fontWeight: '800', marginTop: 4, letterSpacing: .8 },
  hudRight: { flexDirection: 'row', gap: 7 },
  hudPill: { minWidth: 64, height: 55, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,8,11,.45)', borderBottomWidth: 1, borderColor: 'rgba(108,238,255,.22)' },
  hudIcon: { position: 'absolute', left: 6, top: 7, color: CYAN, fontSize: 10 },
  hudValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  hudLabel: { color: 'rgba(220,245,250,.48)', fontSize: 6, fontWeight: '900', letterSpacing: 1.2 },
  worldNode: { position: 'absolute', zIndex: 12, alignItems: 'center', minWidth: 70 },
  nodeBeacon: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(108,238,255,.65)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,10,13,.7)' },
  nodeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: CYAN, shadowColor: CYAN, shadowOpacity: .9, shadowRadius: 7 },
  nodeLabel: { color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 1.7, marginTop: 5, backgroundColor: 'rgba(2,7,10,.64)', paddingHorizontal: 5 },
  nodeSub: { color: CYAN, fontSize: 8, fontWeight: '900', marginTop: 2 },
  nodeLocked: { opacity: .35 },
  nodePressed: { transform: [{ scale: .94 }] },
  dailyNode: { left: 15, top: '48%' },
  weeklyNode: { right: 20, top: '54%' },
  bossNode: { left: 24, top: '31%' },
  questCallout: { position: 'absolute', left: 14, right: 14, zIndex: 30, backgroundColor: 'rgba(2,8,11,.82)', borderLeftWidth: 3, borderLeftColor: CYAN, paddingVertical: 11, paddingHorizontal: 13, shadowColor: '#000', shadowOpacity: .6, shadowRadius: 14 },
  questEyebrow: { color: CYAN, fontSize: 7, fontWeight: '900', letterSpacing: 1.8 },
  questTitle: { color: '#FFF', fontSize: 20, lineHeight: 23, fontWeight: '900', marginTop: 4, maxWidth: '88%' },
  questProgressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  questProgressTrack: { flex: 1, height: 3, backgroundColor: 'rgba(108,238,255,.12)', overflow: 'hidden' },
  questProgressFill: { height: '100%', backgroundColor: CYAN },
  questProgressText: { color: 'rgba(220,245,250,.65)', fontSize: 7, fontWeight: '900', marginLeft: 8 },
  questAction: { marginTop: 9, minHeight: 38, backgroundColor: CYAN, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  questActionPressed: { opacity: .82, transform: [{ scale: .99 }] },
  questActionText: { color: '#001015', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  questReward: { color: '#00313A', fontSize: 8, fontWeight: '900' },
  systemWindowLeft: { position: 'absolute', left: 12, top: '18%', width: 142, paddingVertical: 8, paddingHorizontal: 9, borderLeftWidth: 1, borderLeftColor: 'rgba(108,238,255,.55)', backgroundColor: 'rgba(2,8,12,.28)', zIndex: 11 },
  systemWindowRight: { position: 'absolute', right: 12, top: '18%', width: 150, paddingVertical: 8, paddingHorizontal: 9, borderRightWidth: 1, borderRightColor: 'rgba(118,92,255,.55)', backgroundColor: 'rgba(2,8,12,.28)', zIndex: 11, alignItems: 'flex-end' },
  systemWindowCode: { color: CYAN, fontSize: 6, fontWeight: '900', letterSpacing: 1.4 },
  systemWindowTitle: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 3 },
  systemWindowMeta: { color: 'rgba(210,235,240,.45)', fontSize: 5.5, fontWeight: '800', letterSpacing: .7, marginTop: 3 },
  warningText: { color: '#FF5C63', textShadowColor: '#FF2732', textShadowRadius: 8 },
  worldState: { position: 'absolute', top: '14%', alignSelf: 'center', alignItems: 'center', zIndex: 10 },
  worldStateText: { color: 'rgba(190,238,246,.48)', fontSize: 6, fontWeight: '900', letterSpacing: 2 },
  playerName: { color: 'rgba(255,255,255,.62)', fontSize: 7, fontWeight: '800', marginTop: 4, letterSpacing: 1 },
  loadingRoot: { flex: 1, backgroundColor: '#020508', alignItems: 'center', justifyContent: 'center' },
  loadingSmall: { color: SYSTEM_COLORS.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 4 },
  loadingTitle: { color: SYSTEM_COLORS.white, fontSize: 38, fontWeight: '900', marginTop: 12 },
});
