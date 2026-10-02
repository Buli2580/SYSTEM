import {selectHomeLoop,selectPrimaryAction} from '../gameLoop/selectors';
import {queueTelemetry} from '../telemetry/amplitude';
import { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNavigation from '../components/BottomNavigation';
import SystemError from '../components/SystemError';
import SystemScreen from '../components/SystemScreen';
import { getPlayerProgressPercent } from '../core';
import { getAwakeningProgress } from '../quests/catalog';
import { useSystem } from '../state/SystemProvider';
import { mainStoryObjective } from '../story/selectors';
import { useGameMaster } from '../gameMaster/useGameMaster';
import { directivePresentation } from './directives';
import { playSceneMusic, stopMusic } from '../identity/audio';
import WorldStage from './WorldStage';
import CharacterStage from './CharacterStage';
import MissionFocus from './MissionFocus';

import { useWorldEnvironment } from './useWorldEnvironment';
export default function HomeWorldScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const system = useSystem();
  const {
    player, ready, completedQuestIds, awakeningCompleted, worldUnlocked,
    activeQuestId, error, refreshPlayer, daily, story, lastReward, dismissLastReward, settings, latestRaidVictory, inventory,
  } = system;

  const autoPerformanceMode: 'LOW'|'MEDIUM'|'HIGH' = width < 370 || height < 700 ? 'LOW' : width < 430 || height < 800 ? 'MEDIUM' : 'HIGH';
  const performanceMode = settings.performanceMode ?? autoPerformanceMode;
  const environment = useWorldEnvironment();
  const gm = useGameMaster({...system,hour:environment.hour,victory:!!(lastReward||latestRaidVictory),levelUp:!!lastReward&&lastReward.afterLevel>lastReward.beforeLevel});
  const presentation = directivePresentation(gm.state.world,gm.state.boss,environment.reduced,performanceMode==='LOW');
  const bossActive = gm.state.boss.presence;
  const sceneMode = gm.state.world.reaction;
  const music = sceneMode==='BOSS'||sceneMode==='VICTORY'||sceneMode==='AWAKENING'?sceneMode:activeQuestId?'QUEST':'HOME';
  const awakening = getAwakeningProgress(completedQuestIds);
  const objective = mainStoryObjective(story, awakeningCompleted);
  const progress = awakeningCompleted ? objective.completed : awakening.completed;
  const total = awakeningCompleted ? objective.total : awakening.total;
  const directedQuest = gm.state.mission.quest;
  const loopState=selectHomeLoop({missionId:directedQuest?.id??null,activeQuestId,pendingRewardId:system.celebration?.id,observed:system.gameLoop?.state});
  const primaryAction=selectPrimaryAction(loopState);
  useEffect(()=>{if(ready)system.gameLoop?.observe(loopState);},[ready,loopState.phase,loopState.questId,loopState.rewardId,system.gameLoop?.observe]);
  useEffect(()=>{if(ready)void queueTelemetry({event_type:'LOOP_HOME',event_properties:{phase:'HOME'}}).catch(()=>{});},[ready]);
  const active = directedQuest
    ? { title: directedQuest.title, subtitle: gm.state.mission.reason, route: { pathname: '/quest' as const, params: { questId: directedQuest.id } } }
    : { title: 'WYBIERZ KOLEJNY KROK', subtitle: gm.state.mission.reason, route: '/quests' as const };
  useFocusEffect(useCallback(() => { playSceneMusic(music); return stopMusic; }, [music]));
  useEffect(() => {
    if (!lastReward) return;
    const timer = setTimeout(dismissLastReward, 4200);
    return () => clearTimeout(timer);
  }, [lastReward, dismissLastReward]);

  const weeklyTarget = daily?.weeklyTarget ?? 5;
  const weekly = Math.min(weeklyTarget, daily?.weeklyCompleted ?? 0);
  const dailyDone = daily?.completed ?? 0;


  if (!ready) return <View style={s.loading}><Text style={s.title}>SYSTEM // INITIALIZING</Text>{error&&<SystemError message={error} retry={()=>{void refreshPlayer();}}/>}</View>;
  const gear = inventory.filter(item=>item.equipped).map(item=>item.name).join(' · ');
  return <SystemScreen style={s.root}>
    <WorldStage presentation={presentation} event={sceneMode} foreground={environment.foreground}/>
    <ScrollView contentContainerStyle={[s.content,{paddingTop:12,paddingBottom:Math.max(insets.bottom,8)+104,minHeight:height-insets.top}]}>
      <View style={s.hud}>
        <View><Text style={s.title}>LV {player.realLevel}</Text><Text style={s.meta}>{player.realXp} / {player.realXpToNextLevel} XP</Text><View style={s.track}><View style={[s.fill,{width:`${getPlayerProgressPercent(player)*100}%`}]}/></View></View>
        <View><Text style={s.meta}>ENERGIA {player.gameEnergy}</Text><Text style={s.meta}>STREAK {player.streak}</Text></View>
      </View>
      <View style={s.hotspots}>
        <Pressable accessibilityRole="button" accessibilityState={{disabled:!worldUnlocked}} disabled={!worldUnlocked} onPress={()=>router.push('/world')} style={s.hotspot}><Text style={s.link}>{worldUnlocked?'WORLD → MAPA':'WORLD // ZABLOKOWANY'}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{disabled:!awakeningCompleted}} disabled={!awakeningCompleted} onPress={()=>router.push(gm.state.boss.source==='WORLD_EVENT'?'/world':'/story')} style={s.hotspot}><Text style={s.boss}>{story?.bossComplete?'BOSS // POKONANY':bossActive?'BOSS // ANOMALIA':'BOSS // UŚPIONY'}</Text></Pressable>
      </View>
      <CharacterStage uri={player.avatarUri} evolution={player.avatarEvolution} avatarStyle={settings.avatarStyle??'CYBER'} name={player.displayName} event={sceneMode} reaction={gm.state.character} animate={presentation.animate&&environment.foreground} onPress={()=>router.push('/character')} equipment={gear?<Text numberOfLines={1} style={s.gear}>{gear}</Text>:undefined}/>
      {sceneMode==='VICTORY'&&(lastReward||latestRaidVictory)&&<View pointerEvents="none" accessibilityLiveRegion="polite" style={s.receipt}>
        <Text style={s.gold}>VICTORY // +{lastReward?.realXp??latestRaidVictory?.reward?.xp??0} XP</Text>
        {lastReward&&lastReward.afterLevel>lastReward.beforeLevel&&<Text style={s.meta}>LEVEL {lastReward.beforeLevel} → {lastReward.afterLevel}</Text>}
        {lastReward&&lastReward.afterRank!==lastReward.beforeRank&&<Text style={s.meta}>RANK {lastReward.beforeRank} → {lastReward.afterRank}</Text>}
        {lastReward&&!!lastReward.newTitles.length&&<Text style={s.meta}>NEW TITLE // {lastReward.newTitles[0]}</Text>}
        {lastReward?.worldUnlocked&&<Text style={s.meta}>WORLD GATE // UNLOCKED</Text>}
      </View>}
      {gm.error&&<SystemError message={gm.error} retry={()=>{void gm.refresh();}}/>}
      <MissionFocus mission={gm.state.mission} onChoice={()=>{void gm.refresh(gm.state.campaign.choice==='DISCIPLINE'?'FOCUS':gm.state.campaign.choice==='FOCUS'?'MOTION':'DISCIPLINE');}} title={active.title} subtitle={active.subtitle} progress={progress} total={total} reward={directedQuest?.rewards.realXp??0} action={{label:primaryAction.label,disabled:primaryAction.disabled||!!system.celebration,onPress:()=>router.push(loopState.questId?{pathname:'/quest',params:{questId:loopState.questId}}:active.route as never)}}/>
      <Pressable accessibilityRole="button" onPress={()=>router.push('/quests')} style={s.secondary}><Text style={s.meta}>DAILY {dailyDone}/{daily?.questIds.length??0} · WEEKLY {weekly}/{weeklyTarget} →</Text></Pressable>
    </ScrollView>
    <BottomNavigation/>
  </SystemScreen>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#030a11'},content:{flexGrow:1,paddingHorizontal:16,gap:12},loading:{flex:1,backgroundColor:'#030a11',justifyContent:'center',alignItems:'center'},hud:{flexDirection:'row',justifyContent:'space-between',gap:16},title:{color:'#fff',fontSize:24,fontWeight:'800'},meta:{color:'#c0d4df',fontSize:12,lineHeight:20},track:{height:3,width:140,backgroundColor:'#263c4b',marginTop:5},fill:{height:3,backgroundColor:'#6ceeff'},hotspots:{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap'},hotspot:{minHeight:48,justifyContent:'center',paddingHorizontal:4},link:{color:'#a6e8f3',fontSize:11,fontWeight:'800'},boss:{color:'#dfab9b',fontSize:11,fontWeight:'800'},gear:{color:'#c0d4df',fontSize:10},receipt:{alignItems:'center',padding:8,backgroundColor:'rgba(3,12,18,.85)'},gold:{color:'#ffc45b',fontSize:16,fontWeight:'800'},secondary:{minHeight:44,alignItems:'center',justifyContent:'center'}});
