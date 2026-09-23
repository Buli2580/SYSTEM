import {useCallback,useState} from 'react';
import {Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {useFocusEffect} from 'expo-router';
import {SYSTEM_COLORS as C} from '../core';
import {createMoveGroup,createMoveGroupInvite,joinMoveGroup,getMoveGroupLeaderboard,getMyMoveGroups,type CloudMoveGroup,type CloudMoveLeaderboardRow,type MoveGroupKind} from '../cloud/move';

export default function MoveCloudGroupPanel({kind}:{kind:MoveGroupKind}){
 const[groups,setGroups]=useState<CloudMoveGroup[]>([]);
 const[leaderboard,setLeaderboard]=useState<CloudMoveLeaderboardRow[]>([]);
 const[name,setName]=useState('');
 const[joinCode,setJoinCode]=useState('');
 const[inviteCode,setInviteCode]=useState<string|null>(null);
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState<string|null>(null);

 const refresh=useCallback(async()=>{
  setBusy(true);setMessage(null);
  try{
   const rows=(await getMyMoveGroups()).filter(g=>g.kind===kind);
   setGroups(rows);
   setLeaderboard(rows[0]?await getMoveGroupLeaderboard(rows[0].id,7):[]);
  }catch(e){setGroups([]);setLeaderboard([]);setMessage(e instanceof Error?e.message:'SYSTEM CLOUD niedostępny.');}
  finally{setBusy(false)}
 },[kind]);
 useFocusEffect(useCallback(()=>{void refresh()},[refresh]));

 async function create(){
  const safe=name.trim();if(safe.length<2)return;
  setBusy(true);setMessage(null);
  try{await createMoveGroup(kind,safe);setName('');await refresh();}
  catch(e){setMessage(e instanceof Error?e.message:'Nie udało się utworzyć grupy MOVE.');setBusy(false)}
 }
 async function invite(){
  const group=groups[0];if(!group)return;
  setBusy(true);setMessage(null);
  try{
   const role=kind==='FAMILY'?'MEMBER':'STUDENT';
   const code=await createMoveGroupInvite(group.id,role,kind==='FAMILY'?5:50,24);
   setInviteCode(code);
  }catch(e){setMessage(e instanceof Error?e.message:'Nie udało się utworzyć zaproszenia MOVE.');}
  finally{setBusy(false)}
 }
 async function join(){
  const code=joinCode.trim().toUpperCase();if(!code)return;
  setBusy(true);setMessage(null);
  try{await joinMoveGroup(code);setJoinCode('');await refresh();}
  catch(e){setMessage(e instanceof Error?e.message:'Nie udało się dołączyć do grupy MOVE.');setBusy(false)}
 }

 return <View style={styles.panel}>
  <Text style={styles.label}>{kind} CLOUD // PRIVATE GROUP</Text>
  {groups.length?groups.map(g=><View key={g.id} style={styles.group}>
    <Text style={styles.groupName}>{g.name}</Text>
    <Text style={styles.meta}>{g.role} · {g.memberCount} MEMBERS · {g.totalMinutes} MIN · {g.activeDays} ACTIVE DAYS</Text>
  </View>):<Text style={styles.body}>{busy?'SYNCHRONIZACJA…':'Brak podłączonej grupy online.'}</Text>}
  {!!groups.length&&<Text style={styles.privacy}>Punkty ONLINE obejmują tylko aktywności zaakceptowane przez serwer. Obecnie dostępne dla WALK/RUN/BIKE po zatwierdzeniu odpowiadającej misji core i synchronizacji. Pozostałe MOVE oraz lokalne potwierdzenie opiekuna pozostają wyłącznie lokalne do czasu osobnego protokołu.</Text>}
  {!!leaderboard.length&&<View style={styles.board}>
    <Text style={styles.label}>7D VERIFIED CONTRIBUTION · PARENT/TEACHER VIEW</Text>
    {leaderboard.slice(0,8).map((row,i)=><View key={row.userId} style={styles.row}>
      <Text style={styles.place}>#{i+1}</Text>
      <Text style={styles.user}>PLAYER {row.userId.slice(0,6).toUpperCase()}</Text>
      <Text style={styles.score}>{row.contributionScore}</Text>
    </View>)}
  </View>}
  <TextInput value={name} onChangeText={setName} placeholder={kind==='FAMILY'?'Nazwa rodziny / drużyny':'Nazwa klasy / drużyny'} placeholderTextColor={C.textVeryMuted} maxLength={60} style={styles.input}/>
  <Pressable disabled={busy||name.trim().length<2} onPress={()=>void create()} style={[styles.button,(busy||name.trim().length<2)&&styles.disabled]}>
    <Text style={styles.buttonText}>UTWÓRZ {kind} GROUP</Text>
  </Pressable>
  {!!groups.length&&<Pressable disabled={busy} onPress={()=>void invite()} style={styles.secondaryButton}><Text style={styles.secondaryText}>GENERUJ KOD ZAPROSZENIA</Text></Pressable>}
  {inviteCode&&<Text selectable style={styles.invite}>INVITE CODE // {inviteCode}</Text>}
  <TextInput value={joinCode} onChangeText={setJoinCode} autoCapitalize="characters" placeholder="12-ZNAKOWY KOD ZAPROSZENIA" placeholderTextColor={C.textVeryMuted} maxLength={12} style={styles.input}/>
  <Pressable disabled={busy||joinCode.trim().length!==12} onPress={()=>void join()} style={[styles.secondaryButton,(busy||joinCode.trim().length!==12)&&styles.disabled]}><Text style={styles.secondaryText}>DOŁĄCZ KODEM</Text></Pressable>
  {message&&<Text style={styles.message}>{message}</Text>}
  <Text style={styles.privacy}>Grupa jest prywatna. Ten panel nie publikuje lokalizacji ani danych ciała.</Text>
 </View>;
}
const styles=StyleSheet.create({
 panel:{marginTop:16,padding:16,borderWidth:1,borderColor:C.line,borderRadius:18,backgroundColor:'rgba(4,16,20,.92)'},
 label:{color:C.cyan,fontSize:9,lineHeight:14,fontWeight:'900',letterSpacing:.9},body:{color:C.textMuted,fontSize:10,lineHeight:15,marginTop:8},
 group:{marginTop:10,paddingTop:10,borderTopWidth:1,borderTopColor:'rgba(108,238,255,.1)'},groupName:{color:C.white,fontSize:16,fontWeight:'900'},meta:{color:C.textMuted,fontSize:8,lineHeight:13,marginTop:4},
 board:{marginTop:14},row:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:6},place:{width:28,color:C.cyan,fontWeight:'900'},user:{flex:1,color:C.textMuted,fontSize:9,fontWeight:'800'},score:{color:C.white,fontWeight:'900'},
 input:{marginTop:14,minHeight:48,borderWidth:1,borderColor:C.lineBright,borderRadius:12,paddingHorizontal:12,color:C.white,backgroundColor:'rgba(2,9,12,.8)'},
 button:{marginTop:10,minHeight:48,borderRadius:12,backgroundColor:C.cyan,alignItems:'center',justifyContent:'center'},secondaryButton:{marginTop:10,minHeight:46,borderRadius:12,borderWidth:1,borderColor:C.cyanDark,alignItems:'center',justifyContent:'center'},secondaryText:{color:C.cyan,fontWeight:'900'},invite:{color:'#ffd36c',fontSize:12,fontWeight:'900',letterSpacing:1.2,marginTop:12,textAlign:'center'},disabled:{opacity:.35},buttonText:{color:'#001014',fontWeight:'900'},
 message:{color:C.warning,fontSize:9,lineHeight:14,marginTop:9},privacy:{color:C.textVeryMuted,fontSize:8,lineHeight:13,marginTop:10}
});
