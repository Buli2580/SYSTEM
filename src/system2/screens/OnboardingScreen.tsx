import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { useSystem } from '../state/SystemProvider';
import { playSceneMusic, stopMusic } from '../identity/audio';

const PATHS=[['DISCIPLINE','WIL','Build consistency and finish what you start.'],['MOTION','VIT','Move, train and strengthen your real body.'],['FOCUS','INT','Learn, create and sharpen attention.']] as const;

const pages=[
 ['SYSTEM INITIALIZING','A NEW PLAYER HAS BEEN DETECTED','Twoje prawdziwe działania będą rozwijały postać. SYSTEM obserwuje postęp — nie musisz zarządzać technicznym panelem.'],
 ['PLAYER PROFILE','REAL LEVEL 1 · RANK E','Każdy zaczyna od tego samego miejsca. Wybierz pseudonim — tożsamość gracza może pozostać anonimowa.'],
 ['DIRECTIVE','WHAT DO YOU WANT TO CHANGE?','SYSTEM będzie dobierał misje do Twojego celu, postępu i wykonanych prób. Zacznij od kierunku — reszta stanie się questami.'],
 ['FIRST MISSION','REAL ACTION → VERIFY → XP','Po wejściu do SYSTEM-u dostaniesz pierwszą misję. Wykonaj ją, zdobądź XP i rozpocznij Awakening.'],
] as const;

export default function OnboardingScreen(){
 const [step,setStep]=useState(0),[name,setName]=useState(''),[goal,setGoal]=useState(''),[path,setPath]=useState(0),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
 const busyRef=useRef(false),insets=useSafeAreaInsets(),router=useRouter(); const {finishOnboarding}=useSystem();
 useFocusEffect(useCallback(()=>{playSceneMusic('AWAKENING');return stopMusic;},[]));
 async function enter(){if(busyRef.current)return;if(!goal.trim()){setError('Wpisz główny cel, żeby GAME MASTER mógł dobrać pierwszą ścieżkę.');return;}busyRef.current=true;setBusy(true);setError(null);try{await finishOnboarding(name,{goal,path:PATHS[path][0]});router.replace('/quests');}catch(cause){setError(cause instanceof Error?cause.message:'Nie udało się uruchomić SYSTEM-u.');}finally{busyRef.current=false;setBusy(false);}}
 return <KeyboardAvoidingView style={s.root} behavior={Platform.OS==='ios'?'padding':'height'}>
  <View pointerEvents="none" style={s.energy}><View style={s.ring}/><View style={s.core}/></View>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content,{paddingTop:insets.top+32,paddingBottom:insets.bottom+32}]}>
   <Animated.View key={step} entering={FadeInDown.duration(360)}>
    <Text style={s.code}>SYSTEM // INITIALIZATION {String(step+1).padStart(2,'0')}/04</Text>
    <Text style={s.title}>{pages[step][0]}</Text><Text style={s.subtitle}>{pages[step][1]}</Text><Text style={s.body}>{pages[step][2]}</Text>
    {step===1&&<View style={s.inputBlock}><Text style={s.code}>PLAYER IDENTITY</Text><TextInput accessibilityLabel="SYSTEM NAME — pseudonim" value={name} onChangeText={setName} maxLength={24} autoCorrect={false} placeholder="Twój pseudonim" placeholderTextColor="#6f8790" style={s.input}/></View>}
    {step===2&&<View style={s.inputBlock}><Text style={s.code}>PRIMARY GOAL</Text><TextInput accessibilityLabel="Główny cel" value={goal} onChangeText={setGoal} maxLength={120} multiline placeholder="Np. kondycja, nauka, dyscyplina..." placeholderTextColor="#6f8790" style={[s.input,s.goal]}/><Text style={s.hint}>AI GAME MASTER // profil celu zostanie rozwinięty po pierwszych misjach.</Text></View>}
    {step===3&&<Animated.View entering={ZoomIn.duration(500)} style={s.mission}>
      <Text style={s.code}>AWAKENING // PATH DISCOVERY</Text><Text style={s.missionTitle}>CHOOSE YOUR FIRST SIGNAL</Text>
      <View style={s.paths}>{PATHS.map((p,i)=><Text key={p[0]} onPress={()=>setPath(i)} style={[s.path,path===i&&s.pathActive]}>{p[0]} // {p[1]}{path===i?'  ◀':''}</Text>)}</View>
      <Text style={s.pathDescription}>{PATHS[path][2]}</Text>
      <Text style={s.awakening}>AWAKENING</Text><Text style={s.body}>Path locked. First mission will test this direction. Real action decides what evolves next.</Text>
    </Animated.View>}
    {error&&<SystemError message={error} retry={()=>{void enter();}}/>}
    <Action disabled={busy} label={step===3?(busy?'INITIALIZING…':'ENTER SYSTEM'):'CONTINUE →'} onPress={()=>step===3?void enter():setStep(step+1)}/>
    {step>0&&<Action disabled={busy} label="BACK" onPress={()=>setStep(step-1)}/>}
   </Animated.View>
  </ScrollView>
 </KeyboardAvoidingView>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#020508'},content:{flexGrow:1,justifyContent:'center',paddingHorizontal:26},energy:{...StyleSheet.absoluteFill,alignItems:'center',justifyContent:'center',opacity:.65},ring:{position:'absolute',width:360,height:360,borderRadius:180,borderWidth:1,borderColor:'rgba(82,222,255,.18)'},core:{width:180,height:180,borderRadius:90,backgroundColor:'rgba(20,117,153,.08)',borderWidth:1,borderColor:'rgba(82,222,255,.12)'},code:{color:'#59ddff',fontSize:9,fontWeight:'900',letterSpacing:2.7},title:{color:'#fff',fontSize:38,fontWeight:'900',marginTop:10},subtitle:{color:'#9addec',fontSize:12,fontWeight:'900',letterSpacing:1.5,marginTop:20},body:{color:'#a9bac1',fontSize:16,lineHeight:25,marginTop:12,marginBottom:22},inputBlock:{marginVertical:12},input:{color:'#fff',borderWidth:1,borderColor:'#24505c',backgroundColor:'rgba(3,14,20,.78)',borderRadius:12,padding:16,marginVertical:12},goal:{minHeight:92,textAlignVertical:'top'},hint:{color:'#667d86',fontSize:9,lineHeight:15,letterSpacing:.6},mission:{borderWidth:1,borderColor:'rgba(89,221,255,.3)',backgroundColor:'rgba(4,18,25,.82)',padding:20,marginBottom:20},missionTitle:{color:'#fff',fontSize:26,fontWeight:'900',marginTop:7},paths:{gap:8,marginTop:18},path:{color:'#718992',borderWidth:1,borderColor:'#173842',padding:12,fontSize:10,fontWeight:'900',letterSpacing:1.4},pathActive:{color:'#fff',borderColor:'#765CFF',backgroundColor:'rgba(118,92,255,.16)',textShadowColor:'#765CFF',textShadowRadius:10},pathDescription:{color:'#9addec',fontSize:11,lineHeight:17,marginTop:14},awakening:{color:'#fff',fontSize:34,fontWeight:'900',letterSpacing:5,textAlign:'center',marginTop:24,textShadowColor:'#765CFF',textShadowRadius:18}});
