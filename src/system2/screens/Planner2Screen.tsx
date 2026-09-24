import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect,useMemo,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import {useSystem} from '../state/SystemProvider';
import {STARTER_HABITS,completeHabit,type Habit} from '../habits/engine';
import {buildDayPlan} from '../planning/engine';
import {getQuest} from '../quests/catalog';
import {smartNotificationDecision} from '../notifications/smart2';
const KEY='system.habits.v2';
export default function Planner2Screen(){const x=useSystem();const [habits,setHabits]=useState<Habit[]>([...STARTER_HABITS]);useEffect(()=>{void AsyncStorage.getItem(KEY).then(v=>{if(v)try{setHabits(JSON.parse(v))}catch{}})},[]);const day=new Date().toISOString().slice(0,10);const quests=(x.daily?.questIds??[]).map(id=>getQuest(id)).filter(Boolean).map(q=>({id:q!.id,title:q!.title,minutes:Math.max(5,Math.round((q!.verification.type==='TIMER'?(q!.verification.minimumDurationSeconds??1200):1200)/60))}));const plan=useMemo(()=>buildDayPlan(day,quests,habits),[day,x.daily?.dayKey,habits]);const decision=smartNotificationDecision({streak:x.player.streak,weeklyCompleted:x.daily?.weeklyCompleted,weeklyTarget:5,bossHp:x.story?.bossHp});async function done(h:Habit){const next=habits.map(x=>x.id===h.id?completeHabit(x,day):x);setHabits(next);await AsyncStorage.setItem(KEY,JSON.stringify(next));}return <SystemPage title="PLANNER 2.0" subtitle="CALENDAR // HABITS // SMART NUDGES">
 <View style={s.panel}><Text style={s.label}>SMART NOTIFICATIONS // {decision.kind}</Text><Text style={s.title}>PRIORITY {decision.score}</Text><Text style={s.body}>{decision.reason}</Text></View>
 <View style={s.panel}><Text style={s.label}>TODAY PLAN</Text>{plan.map(b=><Text key={b.id} style={s.body}>{b.startsAt.slice(11,16)} · {b.kind} · {b.title} · {b.minutes} MIN</Text>)}</View>
 <View style={s.panel}><Text style={s.label}>HABIT ENGINE</Text>{habits.map(h=><View key={h.id} style={{marginTop:10}}><Text style={s.title}>{h.title}</Text><Text style={s.body}>{h.frequency} · {h.minutes} MIN · STREAK {h.streak}</Text><Action label={h.lastCompletedDay===day?'DONE ✓':'COMPLETE HABIT'} disabled={h.lastCompletedDay===day} onPress={()=>{void done(h)}}/></View>)}</View>
 </SystemPage>}