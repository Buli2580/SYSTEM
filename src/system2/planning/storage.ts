import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY='system.planner.blocks.v2';
export type PlanFrequency='DAILY'|'WEEKDAYS'|'WEEKLY';
export type CustomPlanBlock={
 id:string;title:string;time:string;minutes:number;kind:'FOCUS'|'MOVE'|'HABIT';
 frequency:PlanFrequency;weekday?:0|1|2|3|4|5|6;
};

function normalize(row:unknown):CustomPlanBlock|null{
 if(!row||typeof row!=='object')return null;
 const b=row as Partial<CustomPlanBlock>;
 const frequency:PlanFrequency=['DAILY','WEEKDAYS','WEEKLY'].includes(String(b.frequency))
   ? b.frequency as PlanFrequency
   : 'DAILY';
 const weekday=typeof b.weekday==='number'&&Number.isInteger(b.weekday)&&b.weekday>=0&&b.weekday<=6
   ? b.weekday as CustomPlanBlock['weekday']
   : undefined;
 const normalized:CustomPlanBlock={
  id:String(b.id??''),title:String(b.title??'').trim(),time:String(b.time??''),
  minutes:Number(b.minutes),kind:b.kind as CustomPlanBlock['kind'],frequency,
  ...(frequency==='WEEKLY'?{weekday:weekday??1}:{}),
 };
 return valid(normalized)?normalized:null;
}
function valid(b:CustomPlanBlock){
 return b.id.length>0&&b.id.length<=120&&
  b.title.length>=2&&b.title.length<=80&&
  /^([01]\d|2[0-3]):[0-5]\d$/.test(b.time)&&
  Number.isSafeInteger(b.minutes)&&b.minutes>=1&&b.minutes<=240&&
  ['FOCUS','MOVE','HABIT'].includes(b.kind)&&
  ['DAILY','WEEKDAYS','WEEKLY'].includes(b.frequency)&&
  (b.frequency!=='WEEKLY'||(Number.isInteger(b.weekday)&&Number(b.weekday)>=0&&Number(b.weekday)<=6));
}
export function planBlockDue(block:CustomPlanBlock,date:Date){
 const weekday=date.getDay();
 if(block.frequency==='DAILY')return true;
 if(block.frequency==='WEEKDAYS')return weekday>=1&&weekday<=5;
 return weekday===(block.weekday??1);
}
export async function loadCustomPlanBlocks():Promise<CustomPlanBlock[]>{
 try{
  const raw=await AsyncStorage.getItem(KEY),value=raw?JSON.parse(raw):[];
  if(!Array.isArray(value))return[];
  const safe=value.map(normalize).filter((x):x is CustomPlanBlock=>Boolean(x)).slice(0,30);
  if(raw&&JSON.stringify(safe)!==JSON.stringify(value))await AsyncStorage.setItem(KEY,JSON.stringify(safe));
  return safe;
 }catch{return[];}
}
export async function saveCustomPlanBlocks(rows:CustomPlanBlock[]){
 const safe=rows.map(normalize).filter((x):x is CustomPlanBlock=>Boolean(x)).slice(0,30);
 await AsyncStorage.setItem(KEY,JSON.stringify(safe));return safe;
}
export async function addCustomPlanBlock(rows:CustomPlanBlock[],input:{
 title:string;time:string;minutes:number;kind:CustomPlanBlock['kind'];frequency:PlanFrequency;weekday?:number;
}){
 const row=normalize({
  id:'plan-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),
  title:input.title,time:input.time,minutes:input.minutes,kind:input.kind,
  frequency:input.frequency,weekday:input.weekday,
 });
 if(!row)throw new Error('Sprawdź nazwę, godzinę HH:MM, czas 1–240 minut i harmonogram.');
 return saveCustomPlanBlocks([...rows,row]);
}
export async function removeCustomPlanBlock(rows:CustomPlanBlock[],id:string){
 return saveCustomPlanBlocks(rows.filter(x=>x.id!==id));
}
