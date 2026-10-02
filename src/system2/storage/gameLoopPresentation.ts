import type {SQLiteDatabase} from 'expo-sqlite';
import type {RewardPresentationStep} from '../gameLoop/rewardPlan';
export const rewardCursorKey=(id:string)=>'game_loop_presentation:'+id;
/** Call inside the existing serialized profile transaction; no reward writes here. */
export async function rewardCursor(db:SQLiteDatabase,id:string,plan:readonly RewardPresentationStep[]):Promise<number>{
 const row=await db.getFirstAsync<{value:string}>('SELECT value FROM app_state WHERE key=?',rewardCursorKey(id));
 if(!row)return 0;
 const saved=JSON.parse(row.value) as {next?:string;done?:boolean};
 if(saved.done===true)return plan.length;
 const index=plan.findIndex(step=>step.key===saved.next);
 if(index<0)throw new Error('Nieprawidłowy checkpoint prezentacji nagrody.');
 return index;
}
export async function advanceRewardCursor(db:SQLiteDatabase,id:string,plan:readonly RewardPresentationStep[],expectedKey:string){
 const current=await rewardCursor(db,id,plan);
 if(plan[current]?.key!==expectedKey)return current;
 const next=current+1;
 await db.runAsync('INSERT INTO app_state(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',rewardCursorKey(id),JSON.stringify(next===plan.length?{done:true}:{next:plan[next].key}));
 return next;
}
