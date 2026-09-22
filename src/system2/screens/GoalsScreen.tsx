import JourneyProgress from '../components/JourneyProgress';
import {useRef,useState} from 'react';
import {KeyboardAvoidingView,Platform,Text,TextInput,View} from 'react-native';
import {useRouter} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import {useSystem} from '../state/SystemProvider';
import {GOAL_CATEGORIES,GOAL_LABELS,type GoalCategory} from '../goals/model';
const FIRST_GOALS:{category:GoalCategory;title:string;target:string}[]=[
 {category:'FITNESS',title:'Poprawić kondycję',target:'Regularnie ruszać się i zwiększać wydolność'},
 {category:'STRENGTH',title:'Zbudować siłę',target:'Regularny trening i mierzalny progres'},
 {category:'DISCIPLINE',title:'Odbudować dyscyplinę',target:'Codziennie dowozić najważniejsze zadania'},
 {category:'LEARNING',title:'Nauczyć się nowej umiejętności',target:'Regularna nauka i widoczny postęp'},
];
export default function GoalsScreen(){
 const {goals=[],journeys=[],createPlayerGoal,createFirstGoalAndPrepareAwakening,updateGoalStatus}=useSystem();
 const router=useRouter();
 const firstGoal=goals.length===0;
 const [category,setCategory]=useState<GoalCategory>('GENERAL'),[priority,setPriority]=useState<1|2|3>(2),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[target,setTarget]=useState(''),[targetDate,setTargetDate]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false),goalOperationKey=useRef('goal:'+Date.now().toString(36)+':'+Math.random().toString(36).slice(2,12));
 async function run(task:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await task();}catch(e){setError(e instanceof Error?e.message:'Nie udało się zapisać celu. Spróbuj ponownie.');}finally{lock.current=false;setBusy(false);}}
 const [opened,setOpened]=useState<string|null>(null);
 const field={color:'#fff',minHeight:48,borderBottomWidth:1,borderBottomColor:'#417480',marginTop:8};
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}><SystemPage title={firstGoal?'PIERWSZY CEL':'CELE'} subtitle={firstGoal?'AWAKENING // AI DIRECTION':'SYSTEM DIRECTION'} intensity={firstGoal?'hero':'quiet'} showNavigation={!firstGoal}>
 {firstGoal&&<View style={s.panel}><Text style={s.label}>05 // PRIMARY OBJECTIVE</Text><Text style={s.title}>CO CHCESZ ZMIENIĆ?</Text><Text style={s.body}>Cel ustawia kierunek, ale nie daje XP. AI Game Master przeanalizuje go, przygotuje briefing ścieżki i otworzy pierwszą linię questów.</Text></View>}
 {firstGoal&&<View style={s.panel}><Text style={s.label}>SZYBKI WYBÓR</Text>{FIRST_GOALS.map(p=><Action key={p.title} disabled={busy} label={(category===p.category&&title===p.title?'● ':'○ ')+p.title} onPress={()=>{setCategory(p.category);setTitle(p.title);setTarget(p.target);setPriority(3);}}/>)}</View>}
 <Text style={s.body}>Cele kierują doborem kolejnych Daily. Dzisiejszy zestaw pozostaje zapisany. Ukończenie celu jest Twoją deklaracją i nie przyznaje XP.</Text>
 {firstGoal&&<Text style={s.body}>Możesz użyć szybkiego wyboru albo wpisać własny cel.</Text>}
 {goals.map(g=><View key={g.id} style={s.panel}><Text style={s.label}>{g.status} · {GOAL_LABELS[g.category]} · PRIORYTET {g.priority}</Text><Text style={s.title}>{g.title}</Text>{!!g.description&&<Text style={s.body}>{g.description}</Text>}{!!g.target&&<Text style={s.body}>Rezultat: {g.target}</Text>}{!!g.targetDate&&<Text style={s.body}>Termin: {g.targetDate}</Text>}
 {journeys.some(j=>j.goalId===g.id)&&<Action label={opened===g.id?'ZWIŃ JOURNEY':'OTWÓRZ JOURNEY'} onPress={()=>setOpened(opened===g.id?null:g.id)}/>}
 {opened===g.id&&journeys.filter(j=>j.goalId===g.id).map(j=><JourneyProgress key={j.id} journey={j}/>)}
 {g.status!=='COMPLETED'&&<><Action disabled={busy} label={g.status==='ACTIVE'?'WSTRZYMAJ':'WZNÓW'} onPress={()=>{void run(()=>updateGoalStatus(g.id,g.status==='ACTIVE'?'PAUSED':'ACTIVE'));}}/><Action disabled={busy} label="CEL OSIĄGNIĘTY · BEZ XP" onPress={()=>{void run(()=>updateGoalStatus(g.id,'COMPLETED'));}}/></>}</View>)}
 <View style={s.panel}><Text style={s.title}>{firstGoal?'USTAW GŁÓWNY CEL':'NOWY CEL'}</Text>
 {GOAL_CATEGORIES.map(c=><Action key={c} label={(category===c?'● ':'○ ')+GOAL_LABELS[c]} disabled={busy} onPress={()=>setCategory(c)}/>)}
 <TextInput accessibilityLabel="Tytuł celu" placeholder="Np. nauka angielskiego" placeholderTextColor="#8397a3" value={title} onChangeText={setTitle} maxLength={80} style={field}/>
 <TextInput accessibilityLabel="Opis celu" placeholder="Opis (opcjonalny)" placeholderTextColor="#8397a3" value={description} onChangeText={setDescription} maxLength={400} multiline style={field}/>
 <TextInput accessibilityLabel="Rezultat celu" placeholder="Rezultat (opcjonalny)" placeholderTextColor="#8397a3" value={target} onChangeText={setTarget} maxLength={120} style={field}/>
 <TextInput accessibilityLabel="Termin celu" placeholder="RRRR-MM-DD (opcjonalny)" placeholderTextColor="#8397a3" value={targetDate} onChangeText={setTargetDate} maxLength={10} style={field}/>
 {([1,2,3] as const).map(p=><Action key={p} label={`${priority===p?'● ':'○ '}PRIORYTET ${p}${p===3?' · WYSOKI':''}`} disabled={busy} onPress={()=>setPriority(p)}/>)}
 <Action label={busy?(firstGoal?'AI ANALIZUJE CEL…':'ZAPISYWANIE…'):(firstGoal?'UTWÓRZ ŚCIEŻKĘ →':'DODAJ CEL')} disabled={busy} onPress={()=>{void run(async()=>{const input={category,priority,title,description,target,targetDate};if(firstGoal){await createFirstGoalAndPrepareAwakening(input);router.replace('/awakening-path');}else{await createPlayerGoal(input,goalOperationKey.current);goalOperationKey.current='goal:'+Date.now().toString(36)+':'+Math.random().toString(36).slice(2,12);setTitle('');setDescription('');setTarget('');setTargetDate('');}});}}/>
 </View>{!!error&&<Text accessibilityRole="alert" style={s.body}>{error}</Text>}
 </SystemPage></KeyboardAvoidingView>;
}
