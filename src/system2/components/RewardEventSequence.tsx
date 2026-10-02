import {useEffect,useRef,useState} from 'react';
import {Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import Animated,{cancelAnimation,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import {useRouter} from 'expo-router';
import {useSystem} from '../state/SystemProvider';
import {useRewardLoop} from '../gameLoop/useRewardLoop';
import {compareItem,itemPower} from '../core/inventory';
import {worldReactions} from '../gameLoop/reactions';
import {presentationEventsFromReceipt} from '../presentation/events';
import {ART,itemArt} from '../visual/assets';
import {ArtThumbnail} from './VisualArt';
import RewardSummary from './RewardSummary';
import {useWorldEnvironment} from '../home4/useWorldEnvironment';
import {playFeedback,playSceneMusic} from '../identity/audio';
import * as Haptics from '../identity/feedback';
import MilestoneCardOverlay from '../cards/MilestoneCardOverlay';
import type {CardReason} from '../cards/engine';
import CombatImpactOverlay from './CombatImpactOverlay';
import CharacterStage from '../home4/CharacterStage';

/** Presents the durable receipt. This component never calls completion or awards XP. */
export default function RewardEventSequence(){
 const system=useSystem(),loop=useRewardLoop(),router=useRouter();
 const environment=useWorldEnvironment();
 const [equipError,setEquipError]=useState<string|null>(null),[equipping,setEquipping]=useState(false);
 const equipLock=useRef(false),lastFeedback=useRef('');
 const [cardOpen,setCardOpen]=useState(false),[combatSeen,setCombatSeen]=useState<string|null>(null);
 const phase=loop.view?.steps[loop.view.current]?.phase;
 const receipt=loop.view?.receipt,loot=loop.view?.loot;
 const cardReason:CardReason|null=receipt?.newTitles.includes('WALLBREAKER')?'BOSS':receipt?.newTitles.includes('AWAKENED')?'AWAKENING':receipt&&receipt.afterRank!==receipt.beforeRank?'RANK_UP':receipt&&receipt.afterLevel>receipt.beforeLevel?'LEVEL_UP':null;
 const progress=useSharedValue(0);
 const bar=useAnimatedStyle(()=>({transform:[{scaleX:progress.value}]}));
 useEffect(()=>{
  if(!phase||!receipt||!environment.foreground)return;
  const key=receipt.id+phase;if(lastFeedback.current===key){progress.value=1;return;}lastFeedback.current=key;
  progress.value=0;progress.value=environment.reduced?1:withTiming(1,{duration:900});
  if(phase==='XP_REWARD'){playFeedback('XP');playSceneMusic('VICTORY');}
  else if(phase==='LEVEL_UP')playFeedback('LEVEL_UP');
  else if(phase==='WORLD_REACTION')playFeedback(receipt.bossDamage?'BOSS_HIT':'PORTAL');
  else if(phase==='LOOT_REWARD')playFeedback('SCAN');
  if(!environment.reduced){
   if(phase==='LEVEL_UP'||loot?.rarity==='LEGENDARY'&&phase==='LOOT_REWARD')void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>undefined);
   else void Haptics.impactAsync(phase==='LOOT_REWARD'?Haptics.ImpactFeedbackStyle.Heavy:phase==='WORLD_REACTION'?Haptics.ImpactFeedbackStyle.Medium:Haptics.ImpactFeedbackStyle.Light).catch(()=>undefined);
  }
  return ()=>cancelAnimation(progress);
 },[phase,receipt?.id,environment.reduced,environment.foreground,loot?.rarity]);
 if(!system.ready||!system.celebration)return null;
 const comparison=loot?compareItem(system.inventory,loot.id,system.player.realLevel):null;
 const equip=async()=>{
  if(!loot||equipLock.current||!comparison?.canEquip)return;
  equipLock.current=true;setEquipping(true);setEquipError(null);
  try{await system.equipItem(loot.id);await loop.advance();}catch{setEquipError('Nie udało się zapisać wyposażenia. Spróbuj ponownie lub zachowaj przedmiot.');}
  finally{equipLock.current=false;setEquipping(false);}
 };
 const advance=async()=>loop.advance();
 return <Modal transparent={false} animationType="none" onRequestClose={()=>{if(!loop.busy&&!equipping)void advance();}}>
  <ScrollView contentContainerStyle={s.root}>
   <Text style={s.code}>SYSTEM // {phase??'ODCZYT NAGRODY'}</Text>
   {phase==='XP_REWARD'&&receipt&&<><ArtThumbnail source={ART.xp}/><RewardSummary receipt={receipt}/><View style={s.track}><Animated.View style={[s.bar,bar]}/></View></>}
   {phase==='LOOT_REWARD'&&loot&&<><ArtThumbnail source={itemArt(loot)}/><Text style={s.gold}>{loot.rarity}</Text><Text style={s.title}>{loot.name}</Text><Text style={s.detail}>POWER {itemPower(loot).toFixed(1)} · LV {loot.requiredLevel}</Text><Text style={s.detail}>{Object.entries(loot.stats).map(([stat,value])=>`${stat} +${value}`).join(' · ')}</Text></>}
   {phase==='LEVEL_UP'&&receipt&&<><ArtThumbnail source={ART.levelUp}/><Text style={s.gold}>LEVEL UP</Text><Text style={s.title}>{receipt.beforeLevel} → {receipt.afterLevel}</Text><Text style={s.detail}>Postęp został zapisany.</Text></>}
   {phase==='EQUIP'&&loot&&comparison&&<><ArtThumbnail source={itemArt(loot)}/><Text style={s.title}>{loot.name}</Text><Text style={s.detail}>Obecnie: {comparison.current?.name??'Pusty slot'}</Text><Text style={s.detail}>POWER Δ {comparison.powerDelta.toFixed(1)}</Text><Text style={s.detail}>{Object.entries(comparison.statDelta).map(([stat,value])=>`${stat} ${value!>=0?'+':''}${value}`).join(' · ')}</Text>{comparison.canEquip?<Pressable accessibilityRole="button" disabled={loop.busy||equipping} onPress={()=>{void equip();}} style={s.button}><Text style={s.label}>WYPOSAŻ</Text></Pressable>:<Text style={s.detail}>Wymagany poziom {loot.requiredLevel}. Przedmiot pozostaje w ekwipunku.</Text>}</>}
   {phase==='WORLD_REACTION'&&receipt&&<><Text style={s.title}>ŚWIAT ODPOWIADA</Text>{worldReactions(receipt).map((r,i)=><Text key={i} style={s.detail}>{r.headline} // {r.detail}</Text>)}{presentationEventsFromReceipt(receipt).filter(e=>e.kind==='SKILL_UP').map(e=><Text key={e.id} style={s.detail}>{e.title}</Text>)}</>}
   {phase==='NEXT_QUEST'&&<><Text style={s.title}>KOLEJNY KROK</Text><Text style={s.detail}>Wynik misji został zapisany w pamięci Game Mastera. Wróć do świata po następną misję.</Text></>}
   {(loop.error||equipError)&&<Text accessibilityLiveRegion="polite" style={s.error}>{loop.error??equipError}</Text>}
   {phase==='WORLD_REACTION'&&<CharacterStage uri={system.player.avatarUri} evolution={system.player.avatarEvolution} avatarStyle={system.settings.avatarStyle??'CYBER'} name={system.player.displayName} event="VICTORY" reaction={loot?'LOOT':'VICTORY'} animate={!environment.reduced&&environment.foreground} equipment={<Text style={s.detail}>{system.inventory.filter(i=>i.equipped).map(i=>i.name).join(' · ')}</Text>}/>}
   {phase==='WORLD_REACTION'&&cardReason&&<Pressable accessibilityRole="button" style={s.button} onPress={()=>setCardOpen(true)}><Text style={s.label}>KARTA OSIĄGNIĘCIA</Text></Pressable>}
   <Pressable accessibilityRole="button" disabled={loop.busy||equipping} style={s.button} onPress={()=>{if(!loop.view){void loop.refresh();return;}void advance().then(saved=>{if(saved&&phase==='NEXT_QUEST'&&!system.awakeningPending)router.replace('/');});}}><Text style={s.label}>{loop.busy||equipping?'ZAPISYWANIE…':!loop.view?'PONÓW ODCZYT':phase==='EQUIP'?'ZACHOWAJ':phase==='NEXT_QUEST'?'WRÓĆ DO ŚWIATA':'KONTYNUUJ'}</Text></Pressable>
  </ScrollView>
  {phase==='WORLD_REACTION'&&receipt?.bossDamage&&combatSeen!==receipt.id&&!environment.reduced&&<CombatImpactOverlay damage={receipt.bossDamage} onDismiss={()=>setCombatSeen(receipt.id)}/>}
  {cardOpen&&cardReason&&<MilestoneCardOverlay player={system.player} reason={cardReason} onDismiss={()=>setCardOpen(false)}/>}
 </Modal>;
}
const s=StyleSheet.create({root:{flexGrow:1,justifyContent:'center',backgroundColor:'#030a11',padding:28,gap:16},code:{color:'#6ceeff',fontSize:12},title:{color:'#fff',fontSize:30,fontWeight:'800'},gold:{color:'#ffd36c',fontSize:24,fontWeight:'800'},detail:{color:'#c0d4df',fontSize:16,lineHeight:24},track:{height:6,backgroundColor:'#263c4b',overflow:'hidden'},bar:{height:6,backgroundColor:'#6ceeff'},button:{borderWidth:1,borderColor:'#6ceeff',padding:18,minHeight:52},label:{color:'#6ceeff',textAlign:'center',fontWeight:'800'},error:{color:'#ff9f9f'}});
