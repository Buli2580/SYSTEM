import type {SQLiteDatabase} from 'expo-sqlite';
import type {PlayerGoal} from '../goals/model';
import type {PlayerProfile} from '../core';
import type {RunnableQuest} from '../quests/types';
import {applyQuestRewards} from '../core/questEngine';
import {dayKey} from '../daily/calendar';
import {getQuest} from '../quests/catalog';
import {newJourney,journeyPlan,primaryJourney,contributesTo,type Journey} from '../journeys/model';
import {storyEvent} from './story';
export async function readJourneys(db:SQLiteDatabase):Promise<Journey[]>{return (await db.getAllAsync<{payload:string}>('SELECT payload FROM journeys ORDER BY id')).map(r=>JSON.parse(r.payload));}
async function save(db:SQLiteDatabase,j:Journey){await db.runAsync('UPDATE journeys SET payload=? WHERE id=?',JSON.stringify(j),j.id);}
export async function ensureJourneys(db:SQLiteDatabase,goals:PlayerGoal[],now=new Date(Date.now()).toISOString()){
 const existing=await readJourneys(db);
 for(const goal of goals){const j=existing.find(j=>j.goalId===goal.id);
  if(!j){if(goal.status==='COMPLETED')continue;const next=newJourney(goal,now);const claim=await db.runAsync('INSERT INTO journeys(id,goal_id,payload) VALUES (?,?,?) ON CONFLICT(goal_id) DO NOTHING',next.id,goal.id,JSON.stringify(next));if(claim.changes)await storyEvent(db,next.id,'JOURNEY_CREATED','JOURNEY CREATED',goal.title);}
  else if(j.status!=='COMPLETED'){const status=goal.status==='ACTIVE'?'ACTIVE':'PAUSED';if(j.status!==status)await save(db,{...j,status,updatedAt:now});}
 }
 return readJourneys(db);
}
export async function bindJourneyQuests(db:SQLiteDatabase,ids:readonly string[],goals:PlayerGoal[],journeys:Journey[]){
 for(const id of ids){const q=getQuest(id);if(!q)continue;
  if(await db.getFirstAsync('SELECT quest_id FROM quest_completions WHERE quest_id=?',id)||await db.getFirstAsync('SELECT attempt_id FROM quest_attempts WHERE quest_id=? LIMIT 1',id))continue;
  const j=primaryJourney(journeys.filter(j=>contributesTo(q,j)),goals);if(j)await db.runAsync('INSERT INTO journey_quests(quest_id,journey_id) VALUES (?,?) ON CONFLICT(quest_id) DO NOTHING',id,j.id);
 }
}
export async function journeyBindings(db:SQLiteDatabase):Promise<Record<string,string>>{const rows=await db.getAllAsync<{quest_id:string;journey_id:string}>('SELECT quest_id,journey_id FROM journey_quests WHERE quest_id IN (SELECT id FROM daily_instances WHERE day_key=(SELECT MAX(day_key) FROM daily_sets))');return Object.fromEntries(rows.map(r=>[r.quest_id,r.journey_id]));}
export async function advanceJourney(db:SQLiteDatabase,player:PlayerProfile,quest:RunnableQuest,now:string){
 const binding=await db.getFirstAsync<{journey_id:string}>('SELECT journey_id FROM journey_quests WHERE quest_id=?',quest.id);if(!binding)return player;
 const j=(await readJourneys(db)).find(j=>j.id===binding.journey_id);if(!j||!contributesTo(quest,j))return player;
 const goal=await db.getFirstAsync<{payload:string}>('SELECT payload FROM player_goals WHERE id=?',j.goalId);if(!goal||JSON.parse(goal.payload).status!=='ACTIVE')return player;
 const claim=await db.runAsync('INSERT INTO journey_activity(quest_id,journey_id,stage,day_key,difficulty) VALUES (?,?,?,?,?) ON CONFLICT(quest_id) DO NOTHING',quest.id,j.id,j.currentStage,dayKey(Date.parse(now)),quest.difficulty);if(!claim.changes)return player;
 const rows=await db.getAllAsync<{day_key:string;difficulty:string}>('SELECT day_key,difficulty FROM journey_activity WHERE journey_id=? AND stage=?',j.id,j.currentStage);
 j.progress={actions:rows.length,days:[...new Set(rows.map(r=>r.day_key))].sort(),normal:rows.filter(r=>r.difficulty==='NORMAL'||r.difficulty==='HARD'||r.difficulty==='EXTREME').length};j.updatedAt=now;
 const plan=journeyPlan(j.category)[j.currentStage];let next=player;
 if(j.progress.actions>=plan.actions&&j.progress.days.length>=plan.days&&j.progress.normal>=plan.normal){
  const milestone=await db.runAsync('INSERT INTO journey_milestones(journey_id,stage,created_at) VALUES (?,?,?) ON CONFLICT(journey_id,stage) DO NOTHING',j.id,j.currentStage,now);
  if(milestone.changes){next=applyQuestRewards(player,{realXp:plan.xp},now);await storyEvent(db,j.id+':milestone:'+j.currentStage,'JOURNEY_MILESTONE',plan.milestone,`+${plan.xp} REAL XP · ${JSON.parse(goal.payload).title}`);}
  j.completedStages.push(j.currentStage);j.currentStage++;
  if(j.currentStage===j.totalStages){j.status='COMPLETED';await storyEvent(db,j.id+':completed','JOURNEY_COMPLETED','JOURNEY COMPLETE','Plan sesji ukończony. Oceń swój osobisty cel w CELE.');}
  else {j.progress={actions:0,days:[],normal:0};await storyEvent(db,j.id+':stage:'+j.currentStage,'JOURNEY_STAGE_ADVANCED',journeyPlan(j.category)[j.currentStage].name,JSON.parse(goal.payload).title);}
 }
 await save(db,j);return next;
}
