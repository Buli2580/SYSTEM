import JourneyProgress from '../components/JourneyProgress';
import {useRef,useState} from 'react';
import {KeyboardAvoidingView,Platform,Text,TextInput,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import {useSystem} from '../state/SystemProvider';
import {GOAL_CATEGORIES,GOAL_LABELS,type GoalCategory} from '../goals/model';
import {useMountedRef} from '../hooks/useMountedRef';
export default function GoalsScreen(){
 const {goals=[],journeys=[],createPlayerGoal,updateGoalStatus}=useSystem();
 const mounted=useMountedRef();
 const [category,setCategory]=useState<GoalCategory>('GENERAL'),[priority,setPriority]=useState<1|2|3>(2),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[target,setTarget]=useState(''),[targetDate,setTargetDate]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false);
 async function run(task:()=>Promise<void>){if(lock.current)return;lock.current=true;if(mounted.current){setBusy(true);setError('');}try{await task();}catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Nie udało się zapisać celu. Spróbuj ponownie.');}finally{lock.current=false;if(mounted.current)setBusy(false);}}
 const [opened,setOpened]=useState<string|null>(null);
 const field={color:'#fff',minHeight:48,borderBottomWidth:1,borderBottomColor:'#417480',marginTop:8};
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}><SystemPage title="CELE" subtitle="SYSTEM DIRECTION">
 <Text style={s.body}>Cele kierują doborem kolejnych Daily. Dzisiejszy zestaw pozostaje zapisany. Ukończenie celu jest Twoją deklaracją i nie przyznaje XP.</Text>
 {goals.length===0&&<Text style={s.body}>Dodaj pierwszy cel. Bez celów SYSTEM nadal proponuje misje ogólne.</Text>}
 {goals.map(g=><View key={g.id} style={s.panel}><Text style={s.label}>{g.status} · {GOAL_LABELS[g.category]} · PRIORYTET {g.priority}</Text><Text style={s.title}>{g.title}</Text>{!!g.description&&<Text style={s.body}>{g.description}</Text>}{!!g.target&&<Text style={s.body}>Rezultat: {g.target}</Text>}{!!g.targetDate&&<Text style={s.body}>Termin: {g.targetDate}</Text>}
 {journeys.some(j=>j.goalId===g.id)&&<Action label={opened===g.id?'ZWIŃ JOURNEY':'OTWÓRZ JOURNEY'} onPress={()=>setOpened(opened===g.id?null:g.id)}/>}
 {opened===g.id&&journeys.filter(j=>j.goalId===g.id).map(j=><JourneyProgress key={j.id} journey={j}/>)}
 {g.status!=='COMPLETED'&&<><Action disabled={busy} label={g.status==='ACTIVE'?'WSTRZYMAJ':'WZNÓW'} onPress={()=>{void run(()=>updateGoalStatus(g.id,g.status==='ACTIVE'?'PAUSED':'ACTIVE'));}}/><Action disabled={busy} label="CEL OSIĄGNIĘTY · BEZ XP" onPress={()=>{void run(()=>updateGoalStatus(g.id,'COMPLETED'));}}/></>}</View>)}
 <View style={s.panel}><Text style={s.title}>NOWY CEL</Text>
 {GOAL_CATEGORIES.map(c=><Action key={c} label={(category===c?'● ':'○ ')+GOAL_LABELS[c]} disabled={busy} onPress={()=>setCategory(c)}/>)}
 <TextInput accessibilityLabel="Tytuł celu" placeholder="Np. nauka angielskiego" placeholderTextColor="#8397a3" value={title} onChangeText={setTitle} maxLength={80} style={field}/>
 <TextInput accessibilityLabel="Opis celu" placeholder="Opis (opcjonalny)" placeholderTextColor="#8397a3" value={description} onChangeText={setDescription} maxLength={400} multiline style={field}/>
 <TextInput accessibilityLabel="Rezultat celu" placeholder="Rezultat (opcjonalny)" placeholderTextColor="#8397a3" value={target} onChangeText={setTarget} maxLength={120} style={field}/>
 <TextInput accessibilityLabel="Termin celu" placeholder="RRRR-MM-DD (opcjonalny)" placeholderTextColor="#8397a3" value={targetDate} onChangeText={setTargetDate} maxLength={10} style={field}/>
 {([1,2,3] as const).map(p=><Action key={p} label={`${priority===p?'● ':'○ '}PRIORYTET ${p}${p===3?' · WYSOKI':''}`} disabled={busy} onPress={()=>setPriority(p)}/>)}
 <Action label={busy?'ZAPISYWANIE…':'DODAJ CEL'} disabled={busy} onPress={()=>{void run(async()=>{await createPlayerGoal({category,priority,title,description,target,targetDate});if(!mounted.current)return;setTitle('');setDescription('');setTarget('');setTargetDate('');});}}/>
 </View>{!!error&&<Text accessibilityRole="alert" style={s.body}>{error}</Text>}
 </SystemPage></KeyboardAvoidingView>;
}
