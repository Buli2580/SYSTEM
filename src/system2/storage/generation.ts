import { readJourneys } from './journeys';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { PlayerProfile } from '../core';
import type { ActivityPreferences } from '../daily/templates';
import { generateLoadout, type GenerationInput, type RecentActivity, type Candidate } from '../generation/engine';
import { templateFor } from '../generation/templates';
import { dayKey, weekKey } from '../daily/calendar';
import { getQuest } from '../quests/catalog';
import { readGoals } from './goals';
import { storyEvent } from './story';
import { readAIConsequenceState } from './aiState';
export async function generationInput(db:SQLiteDatabase,player:PlayerProfile,day:string,prefs:ActivityPreferences):Promise<GenerationInput> {
 const completed=await db.getAllAsync<{quest_id:string;completed_at:string}>('SELECT quest_id,completed_at FROM quest_completions ORDER BY completed_at DESC,quest_id LIMIT 60');
 const failed=await db.getAllAsync<{quest_id:string;ended_at:string}>("SELECT quest_id,MAX(ended_at) AS ended_at FROM quest_attempts WHERE eligible=1 AND result IN ('FAILED','INTERRUPTED','REJECTED','SUSPICIOUS') GROUP BY quest_id ORDER BY ended_at DESC LIMIT 30");
 const offers=await db.getAllAsync<{quest_id:string;day_key:string}>('SELECT quest_id,day_key FROM daily_generation ORDER BY day_key DESC,quest_id LIMIT 30');
 const history:RecentActivity[]=[...completed.map(r=>({id:r.quest_id,time:r.completed_at,result:'COMPLETED' as const})),...failed.map(r=>({id:r.quest_id,time:r.ended_at,result:'FAILED' as const}))].sort((a,b)=>b.time.localeCompare(a.time)||a.id.localeCompare(b.id)).map(r=>({templateId:templateFor(r.id)?.id,category:templateFor(r.id)?.category,difficulty:getQuest(r.id)?.difficulty,day:dayKey(Date.parse(r.time)),result:r.result}));
 history.push(...offers.map(r=>({templateId:templateFor(r.quest_id)?.id,category:templateFor(r.quest_id)?.category,day:r.day_key,result:'OFFERED' as const})));
 const consequence=await readAIConsequenceState(db);
 const week=weekKey(day),weeklyCompleted=(await db.getFirstAsync<{n:number}>('SELECT COUNT(*) AS n FROM daily_instances d JOIN quest_completions c ON c.quest_id=d.id WHERE d.week_key=?',week))?.n??0;
 const weeklyClear=!!await db.getFirstAsync('SELECT bonus_key FROM protocol_bonuses WHERE bonus_key=?','weekly_complete:'+week);
 return {player,day,prefs,journeys:await readJourneys(db),goals:await readGoals(db),history,weeklyCompleted,weeklyClear,systemDebt:consequence.systemDebt};
}
export async function persistCandidate(db:SQLiteDatabase,c:Candidate) {
 const q=c.quest;
 await db.runAsync('INSERT INTO daily_instances(id,template_id,day_key,week_key) VALUES (?,?,?,?)',q.id,q.templateId!,q.dayKey!,weekKey(q.dayKey!));
 await db.runAsync('INSERT INTO daily_generation(quest_id,day_key,template_id,category,reason,recovery,version) VALUES (?,?,?,?,?,?,1)',q.id,q.dayKey!,c.templateId,c.category,c.reason,c.recovery?1:0);
 if(c.recovery)await storyEvent(db,'recovery:'+q.dayKey,'RECOVERY_OFFERED','RETURN TO THE SYSTEM',c.reason);
}
export async function createGeneratedDaily(db:SQLiteDatabase,player:PlayerProfile,day:string,prefs:ActivityPreferences) {
 const candidates=generateLoadout(await generationInput(db,player,day,prefs));
 if(candidates.length!==3)throw new Error('Nie udało się przygotować pełnego zestawu Daily. Ponów odczyt.');
 for(const c of candidates)await persistCandidate(db,c);
 await storyEvent(db,'daily_generated:'+day,'DAILY_GENERATED','DAILY LOADOUT READY','3 misje dobrane lokalnie do celów i historii.');
}
