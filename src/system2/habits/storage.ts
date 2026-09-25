import AsyncStorage from '@react-native-async-storage/async-storage';
import {STARTER_HABITS,type Habit} from './engine';

const KEY='system.habits.v2';
const FREQ=new Set<Habit['frequency']>(['DAILY','WEEKDAYS','WEEKLY']);

function validHabit(value:unknown):value is Habit{
 if(!value||typeof value!=='object')return false;
 const h=value as Partial<Habit>;
 return typeof h.id==='string'&&h.id.length>0&&h.id.length<=120&&
   typeof h.title==='string'&&h.title.trim().length>=2&&h.title.length<=80&&
   FREQ.has(h.frequency as Habit['frequency'])&&
   typeof h.minutes==='number'&&Number.isSafeInteger(h.minutes)&&h.minutes>=1&&h.minutes<=180&&
   typeof h.streak==='number'&&Number.isSafeInteger(h.streak)&&h.streak>=0&&
   (h.lastCompletedDay===undefined||/^\d{4}-\d{2}-\d{2}$/.test(h.lastCompletedDay));
}
export async function loadHabits():Promise<Habit[]>{
 try{
  const raw=await AsyncStorage.getItem(KEY);
  if(!raw)return[...STARTER_HABITS];
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed))return[...STARTER_HABITS];
  const safe=parsed.filter(validHabit).slice(0,50);
  return safe.length?safe:[...STARTER_HABITS];
 }catch{return[...STARTER_HABITS];}
}
export async function saveHabits(rows:Habit[]){
 const safe=rows.filter(validHabit).slice(0,50);
 await AsyncStorage.setItem(KEY,JSON.stringify(safe));
 return safe;
}
export async function addHabit(rows:Habit[],input:{title:string;frequency:Habit['frequency'];minutes:number}){
 const title=input.title.trim();
 if(title.length<2||title.length>80)throw new Error('Nazwa nawyku: 2–80 znaków.');
 if(!FREQ.has(input.frequency))throw new Error('Nieprawidłowa częstotliwość.');
 if(!Number.isSafeInteger(input.minutes)||input.minutes<1||input.minutes>180)throw new Error('Czas nawyku: 1–180 minut.');
 const habit:Habit={id:'habit-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),title,frequency:input.frequency,minutes:input.minutes,streak:0};
 return saveHabits([...rows,habit]);
}
export async function removeHabit(rows:Habit[],id:string){return saveHabits(rows.filter(h=>h.id!==id));}
