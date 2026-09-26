import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SystemPage from '../components/SystemPage';
import { useSystem } from '../state/SystemProvider';
import { completeSession, createSocialSession, joinSession, startSession, syncSessionProgress, type SocialMode, type SocialSession } from '../core/social';

export default function SocialScreen(){
 const { player }=useSystem();
 const [sessions,setSessions]=useState<Partial<Record<SocialMode,SocialSession>>>({});
 function ensure(mode:SocialMode){setSessions(current=>current[mode]?current:{...current,[mode]:createSocialSession(mode,mode.toLowerCase()+'_'+player.id)});}
 function advance(mode:SocialMode){
  setSessions(current=>{const session=current[mode]??createSocialSession(mode,mode.toLowerCase()+'_'+player.id);
   const synced=syncSessionProgress(session,player.verifiedQuestCount);
   const next=synced.state==='LOBBY'?joinSession(synced):synced.state==='READY'?startSession(synced,player.verifiedQuestCount):synced.state==='ACTIVE'?completeSession(synced):synced;
   return{...current,[mode]:next};
  });
 }
 return <SystemPage title="SOCIAL" subtitle="NETWORK // GUILD HALL">
  <Animated.View entering={FadeInDown.duration(420)} style={s.hero}>
   <Text style={s.code}>PLAYER SIGNAL // LOCAL SESSION CORE</Text><Text style={s.title}>{player.displayName}</Text>
   <Text style={s.rank}>RANK {player.rank} · LEVEL {player.realLevel}</Text>
   <Text style={s.meta}>{player.currentTitle} · {player.verifiedQuestCount} VERIFIED QUESTS</Text>
  </Animated.View>
  <View style={s.grid}>
   <SessionTile mode="GUILD" code="GUILD HALL" title="FORM A GUILD" body="Prepare a squad session and cooperative objectives." session={sessions.GUILD} onCreate={()=>ensure('GUILD')} onAdvance={()=>advance('GUILD')}/>
   <SessionTile mode="PVP" code="PVP CHALLENGE" title="PLAYER VS PLAYER" body="Verified real actions decide the challenge — never purchased power." session={sessions.PVP} onCreate={()=>ensure('PVP')} onAdvance={()=>advance('PVP')}/>
   <SessionTile mode="RAID" code="RAID LOBBY" title="CO-OP RAID" body="Four-player session core for shared verified objectives." session={sessions.RAID} onCreate={()=>ensure('RAID')} onAdvance={()=>advance('RAID')}/>
   <View style={s.tile}><Text style={s.code}>RANKING</Text><Text style={s.tileTitle}>WORLD SIGNAL</Text><Text style={s.body}>Rankings stay locked until a real online source exists. No fabricated players or positions.</Text><Text style={s.state}>ONLINE BACKEND REQUIRED</Text></View>
  </View>
  <Text style={s.note}>SOCIAL 3.0 // session state machine is live locally. Network matchmaking, remote members and global rankings remain intentionally unavailable until the online backend is connected.</Text>
 </SystemPage>;
}
function SessionTile({mode,code,title,body,session,onCreate,onAdvance}:{mode:SocialMode;code:string;title:string;body:string;session?:SocialSession;onCreate:()=>void;onAdvance:()=>void}){
 const action=!session?'CREATE SESSION':session.state==='LOBBY'?'JOIN / FILL SLOT':session.state==='READY'?'START':session.state==='ACTIVE'?'SYNC / COMPLETE':'COMPLETE';
 return <View style={s.tile}><Text style={s.code}>{code}</Text><Text style={s.tileTitle}>{title}</Text><Text style={s.body}>{body}</Text>
  <Text style={s.state}>{session?session.state+' · '+session.members+'/'+session.required:'SESSION NOT CREATED'}</Text>{session?.state==='ACTIVE'&&<Text style={s.body}>VERIFIED PROGRESS {session.verifiedProgress}/{session.target} · {session.outcome}</Text>}
  <Pressable accessibilityRole="button" disabled={session?.state==='COMPLETE'} onPress={!session?onCreate:onAdvance} style={({pressed})=>[s.action,pressed&&s.actionPressed,session?.state==='COMPLETE'&&s.actionDisabled]}><Text style={s.actionText}>{action} // {mode}</Text></Pressable>
 </View>;
}
const s=StyleSheet.create({hero:{padding:22,borderWidth:1,borderColor:'rgba(98,239,255,.25)',backgroundColor:'#050b11',marginBottom:14},code:{color:'#62efff',fontSize:8,fontWeight:'900',letterSpacing:2},title:{color:'#fff',fontSize:30,fontWeight:'900',marginTop:8},rank:{color:'#b79cff',fontSize:11,fontWeight:'900',letterSpacing:1.5,marginTop:5},meta:{color:'#78939c',fontSize:9,marginTop:7},grid:{gap:10},tile:{minHeight:132,padding:16,borderWidth:1,borderColor:'#173944',backgroundColor:'rgba(3,10,15,.88)'},tileTitle:{color:'#fff',fontSize:18,fontWeight:'900',marginTop:7},body:{color:'#8da3aa',fontSize:11,lineHeight:17,marginTop:7},state:{color:'#765CFF',fontSize:7,fontWeight:'900',letterSpacing:1.5,marginTop:12},action:{marginTop:12,paddingVertical:11,paddingHorizontal:12,borderWidth:1,borderColor:'rgba(98,239,255,.35)',backgroundColor:'rgba(98,239,255,.06)'},actionPressed:{opacity:.65},actionDisabled:{opacity:.35},actionText:{color:'#dffbff',fontSize:8,fontWeight:'900',letterSpacing:1.2},note:{color:'#5e7881',fontSize:8,lineHeight:14,marginTop:16}});
