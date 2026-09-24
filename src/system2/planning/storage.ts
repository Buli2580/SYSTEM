import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY='system.planner.blocks.v2';
export type CustomPlanBlock={id:string;title:string;time:string;minutes:number;kind:'FOCUS'|'MOVE'|'HABIT'};

function valid(row:unknown):row is CustomPlanBlock{
 if(!row||typeof row!=='object')return false;
 const b=row as Partial<CustomPlanBlock>;
 return typeof b.id==='string'&&b.id.length>0&&b.id.length<=120&&
  typeof b.title==='string'&&b.title.trim().length>=2&&b.title.length<=80&&
  typeof b.time==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time)&&
  typeof b.minutes==='number'&&Number.isSafeInteger(b.minutes)&&b.minutes>=1&&b.minutes<=240&&
  ['FOCUS','MOVE','HABIT'].includes(String(b.kind));
}
export async function loadCustomPlanBlocks():Promise<CustomPlanBlock[]>{
 try{const raw=await AsyncStorage.getItem(KEY);const value=raw?JSON.parse(raw):[];return Array.isArray(value)?value.filter(valid).slice(0,30):[];}catch{return[];}
}
export async function saveCustomPlanBlocks(rows:CustomPlanBlock[]){
 const safe=rows.filter(valid).slice(0,30);await AsyncStorage.setItem(KEY,JSON.stringify(safe));return safe;
}
export async function addCustomPlanBlock(rows:CustomPlanBlock[],input:{title:string;time:string;minutes:number;kind:CustomPlanBlock['kind']}){
 const row:CustomPlanBlock={id:'plan-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),title:input.title.trim(),time:input.time.trim(),minutes:input.minutes,kind:input.kind};
 if(!valid(row))throw new Error('Sprawdź nazwę, godzinę HH:MM i czas 1–240 minut.');
 return saveCustomPlanBlocks([...rows,row]);
}
export async function removeCustomPlanBlock(rows:CustomPlanBlock[],id:string){return saveCustomPlanBlocks(rows.filter(x=>x.id!==id));}
