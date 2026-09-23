import type { SQLiteDatabase } from 'expo-sqlite';
import { validateGoal, type GoalInput, type GoalStatus, type PlayerGoal } from '../goals/model';
import { storyEvent } from './story';
export async function readGoals(db:SQLiteDatabase):Promise<PlayerGoal[]> {
 const rows=await db.getAllAsync<{payload:string}>('SELECT payload FROM player_goals ORDER BY id');
 return rows.map(r=>JSON.parse(r.payload) as PlayerGoal);
}
export async function insertGoal(db:SQLiteDatabase,input:GoalInput,now=Date.now(),operationKey?:string) {
 const valid=validateGoal(input),key=operationKey?.trim();
 if(key&&!/^[A-Za-z0-9._:-]{1,120}$/.test(key))throw new Error('Nieprawidłowy identyfikator operacji celu.');
 if(key){
  const existing=await db.getFirstAsync<{payload:string}>(
   'SELECT g.payload FROM goal_operations o JOIN player_goals g ON g.id=o.goal_id WHERE o.operation_key=?',key
  );
  if(existing)return JSON.parse(existing.payload) as PlayerGoal;
 }
 const goals=await readGoals(db);
 if(goals.filter(g=>g.status!=='COMPLETED').length>=12)throw new Error('Limit 12 otwartych celów. Ukończ dotychczasowe cele.');
 const result=await db.runAsync('INSERT INTO player_goals(payload) VALUES (?)','{}');
 const rawId=result.lastInsertRowId ?? (result as unknown as {lastInsertRowid?:number|bigint}).lastInsertRowid;
 const id=Number(rawId);
 if(!Number.isSafeInteger(id)||id<=0)throw new Error('Nie udało się utworzyć celu.');
 const goal:PlayerGoal={...valid,id:String(id),createdAt:new Date(now).toISOString(),status:'ACTIVE'};
 await db.runAsync('UPDATE player_goals SET payload=? WHERE id=?',JSON.stringify(goal),id);
 if(key)await db.runAsync('INSERT INTO goal_operations(operation_key,goal_id,created_at) VALUES(?,?,?)',key,id,goal.createdAt);
 await storyEvent(db,'goal_created:'+goal.id,'GOAL_CREATED','NOWY CEL',goal.title);
 return goal;
}
export async function changeGoalStatus(db:SQLiteDatabase,id:string,status:GoalStatus) {
 if(!['ACTIVE','PAUSED','COMPLETED'].includes(status))throw new Error('Nieprawidłowy status celu.');
 const goal=(await readGoals(db)).find(g=>g.id===id);if(!goal)throw new Error('Nie znaleziono celu.');
 if(goal.status==='COMPLETED'&&status!=='COMPLETED')throw new Error('Ukończony cel pozostaje w historii.');
 await db.runAsync('UPDATE player_goals SET payload=? WHERE id=?',JSON.stringify({...goal,status}),id);
 if(status==='COMPLETED')await storyEvent(db,'goal_completed:'+id,'GOAL_COMPLETED','CEL UKOŃCZONY',goal.title+' · bez nagrody XP');
}
