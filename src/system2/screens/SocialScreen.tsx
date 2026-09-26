import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SystemPage from '../components/SystemPage';
import { useSystem } from '../state/SystemProvider';
import { completeSession, createSocialSession, joinSession, rematchPvp, resetSocialSession, startSession, syncSessionProgress, type SocialMode, type SocialSession } from '../core/social';

export default function SocialScreen(){
 const { player, socialSessions:sessions, saveSocialSession, claimSocialSession }=useSystem();
 async function ensure(mode:SocialMode){if(!sessions[mode]) await saveSocialSession(createSocialSession(mode,mode.toLowerCase()+'_'+player.id));}
 async function advance(mode:SocialMode){
  const session=sessions[mode]??createSocialSession(mode,mode.toLowerCase()+'_'+player.id);
  const synced=syncSessionProgress(session,player.verifiedQuestCount);
  const next=synced.state==='LOBBY'?joinSession(synced):synced.state==='READY'?startSession(synced,player.verifiedQuestCount):synced.state==='ACTIVE'?completeSession(synced):synced;
  await saveSocialSession(next);
 }
 async function finish(session:SocialSession){if(session.reward&&!session.reward.claimed)await claimSocialSession(session);else await saveSocialSession(session.mode==='PVP'?rematchPvp(session,'pvp_'+player.id+'_'+Date.now()):resetSocialSession(session,session.mode.toLowerCase()+'_'+player.id+'_'+Date.now()));}\n useEffect(()=>{
  (['GUILD','PVP','RAID'] as SocialMode[]).forEach(mode=>{
   const session=sessions[mode]; if(!session||session.state!=='ACTIVE') return;
   const synced=syncSessionProgress(session,player.verifiedQuestCount);
   if(synced.verifiedProgress!==session.verifiedProgress||synced.outcome!==session.outcome) void saveSocialSession(synced.outcome==='SUCCESS'?completeSession(synced):synced);
  });
 },[player.verifiedQuestCount,sessions,saveSocialSession]);
 return <SystemPage title="SOCIAL" subtitle="NETWORK // GUILD HALL">
  <Animated.View entering={FadeInDown.duration(420)} style={s.hero}>
   <Text style={s.code}>PLAYER SIGNAL // LOCAL SESSION CORE</Text><Text style={s.title}>{player.displayName}</Text>
   <Text style={s.rank}>RANK {player.rank} · LEVEL {player.realLevel}</Text>
   <Text style={s.meta}>{player.currentTitle} · {player.verifiedQuestCount} VERIFIED QUESTS</Text>
  </Animated.View>
  <View style={s.grid}>
   <SessionTile mode="GUILD" code="GUILD HALL" title="FORM A GUILD" body="Prepare a squad session and cooperative objectives." session={sessions.GUILD} onFinish={finish} onCreate={()=>{void ensure('GUILD')}} onAdvance={()=>{void advance('GUILD')}}/>
   <SessionTile mode="PVP" code="PVP CHALLENGE" title="PLAYER VS PLAYER" body="Verified real actions decide the challenge — never purchased power." session={sessions.PVP} onFinish={finish} onCreate={()=>{void ensure('PVP')}} onAdvance={()=>{void advance('PVP')}}/>
   <SessionTile mode="RAID" code="RAID LOBBY" title="CO-OP RAID" body="Four-player session core for shared verified objectives." session={sessions.RAID} onFinish={finish} onCreate={()=>{void ensure('RAID')}} onAdvance={()=>{void advance('RAID')}}/>
   <View style={s.tile}><Text style={s.code}>RANKING</Text><Text style={s.tileTitle}>WORLD SIGNAL</Text><Text style={s.body}>Rankings stay locked until a real online source exists. No fabricated players or positions.</Text><Text style={s.state}>ONLINE BACKEND REQUIRED</Text></View>
  </View>
  <Text style={s.note}>SOCIAL 3.0 // session state machine is live locally. Network matchmaking, remote members and global rankings remain intentionally unavailable until the online backend is connected.</Text>
 </SystemPage>;
}
function SessionTile({mode,code,title,body,session,onCreate,onAdvance,onFinish}:{mode:SocialMode;code:string;title:string;body:string;session?:SocialSession;onCreate:()=>void;onAdvance:()=>void;onFinish:(session:SocialSession)=>void}){
 const action=!session?'CREATE SESSION':session.state==='LOBBY'?'JOIN / FILL SLOT':session.state==='READY'?'START':session.state==='ACTIVE'?'SYNC / COMPLETE':session.reward&&!session.reward.claimed?'CLAIM REWARD':mode==='PVP'?'REMATCH':'NEW SESSION';
 return <View style={s.tile}><Text style={s.code}>{code}</Text><Text style={s.tileTitle}>{title}</Text><Text style={s.body}>{body}</Text>
  <Text style={s.state}>{session?session.state+' · '+session.members+'/'+session.required:'SESSION NOT CREATED'}</Text>{session?.state==='ACTIVE'&&<Text style={s.body}>VERIFIED PROGRESS {session.verifiedProgress}/{session.target} · {session.outcome}{session.raid?' · BOSS '+session.raid.bossHp+'/'+session.raid.bossMaxHp+' · PHASE '+session.raid.phase:''}</Text>}{session?.state==='COMPLETE'&&<Text style={s.body}>VICTORY · +{session.reward?.xp??0} SOCIAL XP · {session.reward?.claimed?'REWARD CLAIMED':'LOOT READY'}</Text>}
  <Pressable accessibilityRole="button" onPress={!session?onCreate:session.state==='COMPLETE'?()=>onFinish(session):onAdvance} style={({pressed})=>[s.action,pressed&&s.actionPressed]}><Text style={s.actionText}>{action} // {mode}</Text></Pressable>
 </View>;
}
const s=StyleSheet.create({hero:{padding:22,borderWidth:1,borderColor:'rgba(98,239,255,.25)',backgroundColor:'#050b11',marginBottom:14},code:{color:'#62efff',fontSize:8,fontWeight:'900',letterSpacing:2},title:{color:'#fff',fontSize:30,fontWeight:'900',marginTop:8},rank:{color:'#b79cff',fontSize:11,fontWeight:'900',letterSpacing:1.5,marginTop:5},meta:{color:'#78939c',fontSize:9,marginTop:7},grid:{gap:10},tile:{minHeight:132,padding:16,borderWidth:1,borderColor:'#173944',backgroundColor:'rgba(3,10,15,.88)'},tileTitle:{color:'#fff',fontSize:18,fontWeight:'900',marginTop:7},body:{color:'#8da3aa',fontSize:11,lineHeight:17,marginTop:7},state:{color:'#765CFF',fontSize:7,fontWeight:'900',letterSpacing:1.5,marginTop:12},action:{marginTop:12,paddingVertical:11,paddingHorizontal:12,borderWidth:1,borderColor:'rgba(98,239,255,.35)',backgroundColor:'rgba(98,239,255,.06)'},actionPressed:{opacity:.65},actionDisabled:{opacity:.35},actionText:{color:'#dffbff',fontSize:8,fontWeight:'900',letterSpacing:1.2},note:{color:'#5e7881',fontSize:8,lineHeight:14,marginTop:16}});
