import type {SQLiteDatabase} from 'expo-sqlite';
import type {PlayerProfile,VerifiedEvent} from '../core';
import {getQuest} from '../quests/catalog';
import {missionHistoryEntry,semanticQuest} from '../gameMaster/history';
import type {RunnableQuest} from '../quests/types';
import {decodeCampaign,recordMissionOutcome} from '../gameMaster/campaignStore';
import type {CampaignChoice,MissionOutcome} from '../gameMaster/types';
const KEY='game_master_campaign_v2';
const PARAMETERS='gm_attempt_parameters:';
export async function captureMissionParameters(db:SQLiteDatabase,attemptId:string,quest:RunnableQuest){
 await db.runAsync('INSERT INTO app_state(key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING',PARAMETERS+attemptId,JSON.stringify(semanticQuest(quest)));
}
export async function readMissionMemory(db:SQLiteDatabase):Promise<MissionOutcome[]> {
 const attempts=await db.getAllAsync<{attempt_id:string;quest_id:string;ended_at:string;result:string;reason:string|null;duration:number}>("SELECT attempt_id,quest_id,ended_at,result,reason,duration FROM quest_attempts WHERE result IS NOT NULL AND ended_at IS NOT NULL ORDER BY ended_at DESC,attempt_id DESC LIMIT 500");
 const completed=await db.getAllAsync<{quest_id:string;completed_at:string}>('SELECT quest_id,completed_at FROM quest_completions ORDER BY completed_at DESC,quest_id LIMIT 500');
 const events=await db.getAllAsync<{quest_id:string;payload:string}>('SELECT quest_id,payload FROM verified_events ORDER BY created_at DESC LIMIT 1000');
 const saved=await db.getAllAsync<{key:string;value:string}>("SELECT key,value FROM app_state WHERE key LIKE 'gm_attempt_parameters:%'");
 const parameters=new Map(saved.map(row=>[row.key.slice(PARAMETERS.length),row.value]));
 const evidence=new Map<string,VerifiedEvent>();
 for(const row of events){try{const value=JSON.parse(row.payload) as VerifiedEvent;if(value.verified&&!evidence.has(row.quest_id))evidence.set(row.quest_id,value);}catch{/* Corrupt optional quality is unknown, never success. */}}
 const rows=attempts.filter(a=>a.result!=='COMPLETED').map(a=>({id:a.attempt_id,questId:a.quest_id,at:a.ended_at,result:a.result,reason:a.reason,minutes:a.duration/60}));
 rows.push(...completed.map(c=>{const attempt=attempts.find(a=>a.quest_id===c.quest_id&&a.result==='COMPLETED');const seconds=evidence.get(c.quest_id)?.durationSeconds;return {id:'completion:'+c.quest_id,questId:c.quest_id,at:c.completed_at,result:'COMPLETED',reason:null,minutes:typeof seconds==='number'&&Number.isFinite(seconds)?seconds/60:attempt?attempt.duration/60:0};}));
 return rows.flatMap(row=>{
  const event=row.result==='COMPLETED'?evidence.get(row.questId):undefined;
  const difficulty=event?.questDifficulty;
  const quest=getQuest(row.questId,typeof difficulty==='number'?difficulty:undefined);if(!quest)return [];
  const quality=event?.verificationScore;
  const entry=missionHistoryEntry({...row,quest,verification:typeof quality==='number'&&Number.isFinite(quality)?quality:null});
  const attemptId=row.result==='COMPLETED'?attempts.find(a=>a.quest_id===row.questId&&a.result==='COMPLETED')?.attempt_id:row.id;
  const raw=attemptId?parameters.get(attemptId):undefined;
  if(raw){try{const captured=JSON.parse(raw) as ReturnType<typeof semanticQuest>;if(Number.isFinite(captured.difficulty)&&captured.difficulty>=1&&captured.difficulty<=5&&Number.isFinite(captured.plannedMinutes)&&captured.plannedMinutes>0&&typeof captured.signature==='string')return [{...entry,difficulty:captured.difficulty,plannedMinutes:captured.plannedMinutes,signature:captured.signature}];}catch{/* Legacy/corrupt optional metadata cannot create a successful verification. */}}
  if(event?.questTarget&&Number.isFinite(event.questTarget))entry.plannedMinutes=quest.verification.type==='TIMER'?event.questTarget/60:event.questTarget/(quest.activityType==='BIKE'?240:quest.activityType==='RUN'?150:75);
  return [entry];
 }).sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));
}
export async function reconcileGameMaster(db:SQLiteDatabase,player:PlayerProfile,now:string,initialChoice?:CampaignChoice,choice?:CampaignChoice) {
 const row=await db.getFirstAsync<{value:string}>('SELECT value FROM app_state WHERE key=?',KEY);
 let campaign=decodeCampaign(row?.value??null,player.id,now,initialChoice);
 const history=await readMissionMemory(db);
 for(const outcome of history){
  campaign=recordMissionOutcome(campaign,outcome);
  if(Date.parse(outcome.at)<Date.parse(campaign.startedAt))continue;
  const consequence=outcome.result==='COMPLETED'?'PROGRESS':outcome.result==='TECHNICAL'?'RETRY':'REST';
  await db.runAsync('INSERT INTO story_events(id,type,title,subtitle,created_at,consumed) VALUES (?,?,?,?,?,0) ON CONFLICT(id) DO NOTHING','gm_outcome:'+outcome.id,'GM_OUTCOME','SYSTEM // ŚLAD W ŚWIECIE',`${consequence} · ${outcome.family} · ${outcome.result==='COMPLETED'?'Świat zapamiętał ukończoną misję.':outcome.result==='TECHNICAL'?'Postęp zachowany. Możesz ponowić próbę.':'Następna dyrektywa uwzględni spokojniejszy krok.'}`,outcome.at);
 }
 if(choice){if(!['DISCIPLINE','MOTION','FOCUS'].includes(choice))throw new Error('GM_CHOICE_INVALID');campaign={...campaign,choice};}
 const value=JSON.stringify(campaign);
 if(row?.value!==value)await db.runAsync('INSERT INTO app_state(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',KEY,value);
 return {campaign,history};
}
