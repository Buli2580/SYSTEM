import type { SQLiteDatabase } from 'expo-sqlite';
import { newUserModel, normalizeUserModel, planAdaptiveDay, recordOutcome, setLifeState, type LifeState, type Outcome, type UserModel } from './engine';

const KEY='adaptive_user_model_v1';
export async function readAdaptiveModel(db:SQLiteDatabase):Promise<UserModel>{
 const row=await db.getFirstAsync<{value:string}>('SELECT value FROM app_state WHERE key=?',KEY);
 if(!row)return newUserModel();
 try{return normalizeUserModel(JSON.parse(row.value));}catch{return newUserModel();}
}
async function write(db:SQLiteDatabase,model:UserModel):Promise<void>{
 await db.runAsync('INSERT INTO app_state(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',KEY,JSON.stringify(model));
}
export async function recordAdaptiveOutcome(db:SQLiteDatabase,event:Outcome):Promise<UserModel>{
 const current=await readAdaptiveModel(db);
 const next=recordOutcome(current,event);
 if(next!==current)await write(db,next);
 return next;
}
export async function updateAdaptiveLifeState(db:SQLiteDatabase,state:LifeState):Promise<UserModel>{
 const next=setLifeState(await readAdaptiveModel(db),state);
 await write(db,next);
 return next;
}
export async function updateAdaptiveAvailableMinutes(db:SQLiteDatabase,minutes:number):Promise<UserModel>{
 if(!Number.isFinite(minutes)||minutes<2||minutes>240)throw new Error('Dostępny czas: 2–240 minut.');
 const next={...await readAdaptiveModel(db),availableMinutes:Math.round(minutes),updatedAt:new Date().toISOString()};
 await write(db,next);
 return next;
}
export async function loadAdaptivePlan(db:SQLiteDatabase,now=new Date(Date.now()).toISOString()){return planAdaptiveDay(await readAdaptiveModel(db),now);}

export async function readBossDifficulty(db:SQLiteDatabase):Promise<number>{
 const row=await db.getFirstAsync<{value:string}>('SELECT value FROM app_state WHERE key=?','adaptive_boss_difficulty_v1');
 const value=Number(row?.value);
 return Number.isInteger(value)&&value>=1&&value<=5?value:2;
}
