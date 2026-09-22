import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { getValidSession } from '../cloud/auth';
import {
  followPlayer,getFollowingIds,getLeaderboard,getMySocialProfile,searchPlayers,unfollowPlayer,
  type LeaderboardEntry,type SocialProfile,
} from '../cloud/social';

type Scope = 'WORLD' | 'CONTINENT' | 'COUNTRY' | 'REGION' | 'CITY';
const scopeLabels: Record<Scope,string>={WORLD:'ŚWIAT',CONTINENT:'KONTYNENT',COUNTRY:'KRAJ',REGION:'REGION',CITY:'MIASTO'};
const inputStyle={color:'#fff',minHeight:52,borderWidth:1,borderColor:'#24505c',borderRadius:12,paddingHorizontal:14,marginTop:10} as const;

export default function LeaderboardScreen(){
 const router=useRouter();
 const[me,setMe]=useState<SocialProfile|null>(null),[myId,setMyId]=useState<string|null>(null),[checked,setChecked]=useState(false);
 const[scope,setScope]=useState<Scope>('WORLD'),[rows,setRows]=useState<LeaderboardEntry[]>([]),[following,setFollowing]=useState<Set<string>>(new Set());
 const[query,setQuery]=useState(''),[search,setSearch]=useState<SocialProfile[]>([]);
 const[busy,setBusy]=useState(true),[error,setError]=useState<string|null>(null);
 const lock=useRef(false),mounted=useRef(true),loadEpoch=useRef(0),searchEpoch=useRef(0);

 useEffect(()=>{void run(()=>load('WORLD')).finally(()=>{if(mounted.current)setChecked(true);});return()=>{mounted.current=false;loadEpoch.current++;searchEpoch.current++;};},[]);

 const scopeValue=(next:Scope)=>{
  if(!me)return null;
  if(next==='CONTINENT')return me.continent_code;
  if(next==='COUNTRY')return me.country_code;
  if(next==='REGION')return me.region_code;
  if(next==='CITY')return me.city_label;
  return null;
 };

 async function load(nextScope:Scope){
  const id=++loadEpoch.current;
  if(mounted.current)setRows([]);
  const session=await getValidSession();
  if(!mounted.current||id!==loadEpoch.current)return;
  if(!session){setMyId(null);setMe(null);setFollowing(new Set());setRows([]);return;}
  const[profile,ids]=await Promise.all([getMySocialProfile(),getFollowingIds()]);
  if(!mounted.current||id!==loadEpoch.current)return;
  setMyId(session.user.id);setMe(profile);setFollowing(new Set(ids));
  const value=nextScope==='WORLD'?null:nextScope==='CONTINENT'?profile.continent_code:nextScope==='COUNTRY'?profile.country_code:nextScope==='REGION'?profile.region_code:profile.city_label;
  if(nextScope!=='WORLD'&&!value){setRows([]);return;}
  const nextRows=await getLeaderboard(nextScope,value,50);
  if(mounted.current&&id===loadEpoch.current)setRows(nextRows);
 }

 async function run(task:()=>Promise<void>){
  if(lock.current)return;lock.current=true;
  if(mounted.current){setBusy(true);setError(null);}
  try{await task();}catch(cause){if(mounted.current)setError(cause instanceof Error?cause.message:'Nie udało się wykonać operacji.');}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 }

 async function changeScope(next:Scope){await load(next);if(mounted.current)setScope(next);}
 async function toggleFollow(userId:string){
  if(following.has(userId))await unfollowPlayer(userId);else await followPlayer(userId);
  await load(scope);
 }
 async function searchNow(){
  const id=++searchEpoch.current;const term=query;
  if(mounted.current)setSearch([]);
  const found=await searchPlayers(term,20);
  if(mounted.current&&id===searchEpoch.current)setSearch(found);
 }

 return <SystemPage title="RANKINGI" subtitle="SYSTEM ONLINE // RYWALIZACJA">
  <View style={s.panel}><Text style={s.label}>RANKING GLOBALNY I LOKALNY</Text><Text style={s.body}>Pozycję wyznacza potwierdzony progres zapisany w chmurze SYSTEMU. Profil prywatny nie pojawia się w rankingach.</Text><Action label="← SYSTEM ONLINE" onPress={()=>router.replace('/account')}/></View>

  {!checked?<View style={s.panel}><Text style={s.title}>SPRAWDZANIE SYSTEM CLOUD…</Text><Text style={s.body}>Ładowanie sesji i rankingu.</Text></View>
  :!myId?<View style={s.panel}><Text style={s.title}>Najpierw połącz konto</Text><Text style={s.body}>Rankingi i obserwowanie graczy wymagają konta SYSTEM ONLINE.</Text><Action label="PRZEJDŹ DO LOGOWANIA" onPress={()=>router.replace('/account')}/></View>
  :<>
   <View style={s.panel}><Text style={s.label}>ZAKRES RANKINGU</Text>
    {(['WORLD','CONTINENT','COUNTRY','REGION','CITY'] as Scope[]).map(item=>{const value=item==='WORLD'?'globalnie':scopeValue(item);return <Pressable key={item} disabled={busy||(item!=='WORLD'&&!value)} accessibilityRole="button" accessibilityState={{selected:scope===item,disabled:item!=='WORLD'&&!value}} onPress={()=>{void run(()=>changeScope(item));}} style={{paddingVertical:12,opacity:item!=='WORLD'&&!value?0.4:1}}><Text style={scope===item?s.label:s.body}>{(scope===item?'● ':'○ ')+scopeLabels[item]+(item!=='WORLD'?' · '+(value??'ustaw w profilu'):'')}</Text></Pressable>;})}
   </View>

   <View style={s.panel}><Text style={s.label}>{scopeLabels[scope]} // TOP 50</Text>
    {!busy&&rows.length===0?<Text style={s.body}>Brak graczy w tym zakresie albo nie ustawiono lokalizacji rankingu.</Text>:rows.map(row=><View key={row.user_id} style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#17333e'}}>
     <Text style={s.title}>{'#'+row.rank_position+' @'+(row.handle??'gracz')}</Text>
     <Text style={s.body}>{(row.public_name??'Gracz SYSTEMU')+' · poziom '+row.real_level+' · ranga '+row.rank}</Text>
     <Text style={s.body}>{row.real_total_xp+' REAL XP · '+row.follower_count+' obserwujących'}</Text>
     {row.user_id!==myId&&<Action label={following.has(row.user_id)?'PRZESTAŃ OBSERWOWAĆ':'OBSERWUJ'} disabled={busy} onPress={()=>{void run(()=>toggleFollow(row.user_id));}}/>}
    </View>)}
   </View>

   <View style={s.panel}><Text style={s.label}>ZNAJDŹ GRACZA</Text><Action label="OTWÓRZ WYSZUKIWARKĘ GRACZY →" onPress={()=>router.push('/player-search')}/>
    <TextInput accessibilityLabel="Szukaj po nazwie użytkownika lub display name" autoCapitalize="none" autoCorrect={false} value={query} onChangeText={value=>{setQuery(value);setSearch([]);searchEpoch.current++;}} placeholder="np. buli2580 lub nazwa gracza" placeholderTextColor="#8397a3" style={inputStyle}/>
    <Action label="SZUKAJ" disabled={busy||query.trim().length<2} onPress={()=>{void run(searchNow);}}/>
    {search.map(profile=><View key={profile.user_id} style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#17333e'}}>
     <Text style={s.title}>{profile.handle?'@'+profile.handle:(profile.public_name??'Gracz SYSTEMU')}</Text>
     <Text style={s.body}>{(profile.public_name??'Gracz SYSTEMU')+' · poziom '+profile.real_level+' · '+profile.real_total_xp+' REAL XP'}</Text>
     <Text style={s.body}>{profile.bio||'Brak opisu.'}</Text>
     {profile.user_id!==myId&&<Action label={following.has(profile.user_id)?'PRZESTAŃ OBSERWOWAĆ':'OBSERWUJ'} disabled={busy} onPress={()=>{void run(()=>toggleFollow(profile.user_id));}}/>}
    </View>)}
   </View>
  </>}
  {error&&<SystemError message={error} retry={()=>setError(null)} actionLabel="ZAMKNIJ"/>}
 </SystemPage>;
}
