import type { SQLiteDatabase } from 'expo-sqlite';
import { validateGoal, type GoalInput, type GoalStatus, type PlayerGoal } from '../goals/model';
import { storyEvent } from './story';
export async function readGoals(db:SQLiteDatabase):Promise<PlayerGoal[]> {
 const rows=await db.getAllAsync<{payload:string}>('SELECT payload FROM player_goals ORDER BY id');
 return rows.map(r=>JSON.parse(r.payload) as PlayerGoal);
}
export async function insertGoal(db:SQLiteDatabase,input:GoalInput,now=Date.now()) {
 const valid=validateGoal(input),goals=await readGoals(db);
 if(goals.filter(g=>g.status!=='COMPLETED').length>=12)throw new Error('Limit 12 otwartych celów. Ukończ dotychczasowe cele.');
 const result=await db.runAsync('INSERT INTO player_goals(payload) VALUES (?)','{}');
 const goal:PlayerGoal={...valid,id:String(result.lastInsertRowId),createdAt:new Date(now).toISOString(),status:'ACTIVE'};
 await db.runAsync('UPDATE player_goals SET payload=? WHERE id=?',JSON.stringify(goal),result.lastInsertRowId);
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
