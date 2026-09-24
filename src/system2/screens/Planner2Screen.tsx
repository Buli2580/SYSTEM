import {useEffect,useMemo,useState} from 'react';
import {Text,TextInput,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {useSystem} from '../state/SystemProvider';
import {completeHabit,dueHabits,type Habit} from '../habits/engine';
import {addHabit,loadHabits,removeHabit,saveHabits} from '../habits/storage';
import {buildDayPlan,type PlanBlock} from '../planning/engine';
import {addCustomPlanBlock,loadCustomPlanBlocks,removeCustomPlanBlock,type CustomPlanBlock} from '../planning/storage';
import {getQuest} from '../quests/catalog';
import {smartNotificationDecision} from '../notifications/smart2';
import {dayKey} from '../daily/calendar';
import {clearPlannerBlockReminders,requestPlannerReminderPermission,syncPlannerBlockReminders} from '../notifications/planner2';

export default function Planner2Screen(){
 const x=useSystem();
 const[habits,setHabits]=useState<Habit[]>([]),[blocks,setBlocks]=useState<CustomPlanBlock[]>([]);
 const[habitTitle,setHabitTitle]=useState(''),[habitMinutes,setHabitMinutes]=useState('10'),[habitFrequency,setHabitFrequency]=useState<Habit['frequency']>('DAILY');
 const[blockTitle,setBlockTitle]=useState(''),[blockTime,setBlockTime]=useState('18:00'),[blockMinutes,setBlockMinutes]=useState('30'),[blockKind,setBlockKind]=useState<CustomPlanBlock['kind']>('FOCUS');
 const[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 useEffect(()=>{void Promise.all([loadHabits(),loadCustomPlanBlocks()]).then(([h,b])=>{setHabits(h);setBlocks(b)}).catch(()=>setError('Nie udało się odczytać Planner 2.0.'))},[]);
 const day=dayKey(),weekday=new Date().getDay();
 const quests=(x.daily?.questIds??[]).map(id=>getQuest(id)).filter(Boolean).map(q=>({
   id:q!.id,title:q!.title,
   minutes:Math.max(5,Math.round((q!.verification.type==='TIMER'?q!.verification.minimumDurationSeconds:1200)/60)),
 }));
 const due=dueHabits(habits,day,weekday);
 const plan=useMemo(()=>{
  const auto=buildDayPlan(day,quests,due);
  const custom:PlanBlock[]=blocks.map(b=>({id:b.id,title:b.title,startsAt:day+'T'+b.time+':00',minutes:b.minutes,kind:b.kind}));
  return [...auto,...custom].sort((a,b)=>a.startsAt.localeCompare(b.startsAt));
 },[day,x.daily?.dayKey,habits,blocks]);
 const decision=smartNotificationDecision({streak:x.player.streak,weeklyCompleted:x.daily?.weeklyCompleted,weeklyTarget:5,bossHp:x.story?.bossHp});
 const[plannerNotice,setPlannerNotice]=useState<string>('NOT SCHEDULED');

 async function mutate(task:()=>Promise<void>){if(busy)return;setBusy(true);setError(null);try{await task()}catch(e){setError(e instanceof Error?e.message:'Planner: operacja nie powiodła się.')}finally{setBusy(false)}}
 async function done(h:Habit){const next=habits.map(row=>row.id===h.id?completeHabit(row,day):row);setHabits(await saveHabits(next));}
 async function createHabit(){const minutes=Number(habitMinutes);setHabits(await addHabit(habits,{title:habitTitle,frequency:habitFrequency,minutes}));setHabitTitle('');}
 async function createBlock(){const minutes=Number(blockMinutes);setBlocks(await addCustomPlanBlock(blocks,{title:blockTitle,time:blockTime,minutes,kind:blockKind}));setBlockTitle('');}

 return <SystemPage title="PLANNER 2.0" subtitle="CALENDAR // HABITS // SMART NUDGES">
  {error&&<SystemError message={error} retry={()=>setError(null)} actionLabel="ZAMKNIJ"/>}
  <View style={s.panel}><Text style={s.label}>SMART NOTIFICATIONS // {decision.kind}</Text><Text style={s.title}>PRIORITY {decision.score}</Text><Text style={s.body}>{decision.reason}</Text></View>
  <View style={s.panel}><Text style={s.label}>PLANNER REMINDERS // {plannerNotice}</Text><Text style={s.body}>Custom blocks mogą przypominać 10 minut przed startem przez najbliższe 7 dni.</Text>
   <Action label="ZAPLANUJ PRZYPOMNIENIA 7 DNI" disabled={busy||blocks.length===0} onPress={()=>void mutate(async()=>{const granted=await requestPlannerReminderPermission();if(!granted)throw new Error('Brak zgody na powiadomienia.');const count=await syncPlannerBlockReminders(blocks,7,10);setPlannerNotice(count+' SCHEDULED');})}/>
   <Action label="WYCZYŚĆ PRZYPOMNIENIA PLANNERA" disabled={busy} onPress={()=>void mutate(async()=>{const count=await clearPlannerBlockReminders();setPlannerNotice('CLEARED '+count);})}/>
  </View>

  <View style={s.panel}><Text style={s.label}>TODAY PLAN // {day}</Text>
   {plan.length===0?<Text style={s.body}>Brak bloków na dziś.</Text>:plan.map(b=><View key={b.id} style={{marginTop:8}}><Text style={s.body}>{b.startsAt.slice(11,16)} · {b.kind} · {b.title} · {b.minutes} MIN</Text>{b.id.startsWith('plan-')&&<Action label="USUŃ BLOK" disabled={busy} onPress={()=>void mutate(async()=>setBlocks(await removeCustomPlanBlock(blocks,b.id)))}/>}</View>)}
  </View>

  <View style={s.panel}><Text style={s.label}>DODAJ BLOK DNIA</Text>
   <TextInput value={blockTitle} onChangeText={setBlockTitle} maxLength={80} placeholder="np. SYSTEM — projekt aplikacji" placeholderTextColor="#708690" style={input}/>
   <TextInput value={blockTime} onChangeText={setBlockTime} maxLength={5} placeholder="18:00" placeholderTextColor="#708690" style={input}/>
   <TextInput value={blockMinutes} onChangeText={setBlockMinutes} keyboardType="number-pad" maxLength={3} placeholder="30 min" placeholderTextColor="#708690" style={input}/>
   {(['FOCUS','MOVE','HABIT'] as const).map(kind=><Action key={kind} label={(blockKind===kind?'✓ ':'')+kind} disabled={busy} onPress={()=>setBlockKind(kind)}/>)}
   <Action label="DODAJ DO PLANU" disabled={busy||blockTitle.trim().length<2} onPress={()=>void mutate(createBlock)}/>
  </View>

  <View style={s.panel}><Text style={s.label}>HABIT ENGINE 2.0</Text>
   {habits.map(h=><View key={h.id} style={{marginTop:12}}><Text style={s.title}>{h.title}</Text><Text style={s.body}>{h.frequency} · {h.minutes} MIN · STREAK {h.streak}</Text><Action label={h.lastCompletedDay===day?'DONE ✓':'COMPLETE HABIT'} disabled={busy||h.lastCompletedDay===day} onPress={()=>void mutate(()=>done(h))}/><Action label="USUŃ NAWYK" disabled={busy} onPress={()=>void mutate(async()=>setHabits(await removeHabit(habits,h.id)))}/></View>)}
  </View>

  <View style={s.panel}><Text style={s.label}>NOWY NAWYK</Text>
   <TextInput value={habitTitle} onChangeText={setHabitTitle} maxLength={80} placeholder="np. 20 minut niemieckiego" placeholderTextColor="#708690" style={input}/>
   <TextInput value={habitMinutes} onChangeText={setHabitMinutes} keyboardType="number-pad" maxLength={3} placeholder="10 min" placeholderTextColor="#708690" style={input}/>
   {(['DAILY','WEEKDAYS','WEEKLY'] as const).map(freq=><Action key={freq} label={(habitFrequency===freq?'✓ ':'')+freq} disabled={busy} onPress={()=>setHabitFrequency(freq)}/>)}
   <Action label="DODAJ NAWYK" disabled={busy||habitTitle.trim().length<2} onPress={()=>void mutate(createHabit)}/>
  </View>
 </SystemPage>;
}

const input={color:'#fff',minHeight:48,borderWidth:1,borderColor:'#24505c',borderRadius:12,paddingHorizontal:12,marginTop:10} as const;
