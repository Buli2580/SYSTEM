import type {SQLiteDatabase} from 'expo-sqlite';
import type {PlayerProfile,VerifiedEvent} from '../core';
import {getQuest} from '../quests/catalog';
import {missionHistoryEntry} from '../gameMaster/history';
import {decodeCampaign,recordMissionOutcome} from '../gameMaster/campaignStore';
import type {CampaignChoice,MissionOutcome} from '../gameMaster/types';
const KEY='game_master_campaign_v2';
export async function readMissionMemory(db:SQLiteDatabase):Promise<MissionOutcome[]> {
 const attempts=await db.getAllAsync<{attempt_id:string;quest_id:string;ended_at:string;result:string;reason:string|null;duration:number}>("SELECT attempt_id,quest_id,ended_at,result,reason,duration FROM quest_attempts WHERE result IS NOT NULL AND ended_at IS NOT NULL ORDER BY ended_at DESC,attempt_id DESC LIMIT 500");
 const completed=await db.getAllAsync<{quest_id:string;completed_at:string}>('SELECT quest_id,completed_at FROM quest_completions ORDER BY completed_at DESC,quest_id LIMIT 500');
 const events=await db.getAllAsync<{quest_id:string;payload:string}>('SELECT quest_id,payload FROM verified_events ORDER BY created_at DESC LIMIT 1000');
 const evidence=new Map<string,VerifiedEvent>();
 for(const row of events){try{const value=JSON.parse(row.payload) as VerifiedEvent;if(value.verified&&!evidence.has(row.quest_id))evidence.set(row.quest_id,value);}catch{/* Corrupt optional quality is unknown, never success. */}}
 const rows=attempts.filter(a=>a.result!=='COMPLETED').map(a=>({id:a.attempt_id,questId:a.quest_id,at:a.ended_at,result:a.result,reason:a.reason,minutes:a.duration/60}));
 rows.push(...completed.map(c=>{const attempt=attempts.find(a=>a.quest_id===c.quest_id&&a.result==='COMPLETED');return {id:'completion:'+c.quest_id,questId:c.quest_id,at:c.completed_at,result:'COMPLETED',reason:null,minutes:attempt?attempt.duration/60:0};}));
 return rows.flatMap(row=>{const quest=getQuest(row.questId);if(!quest)return [];const quality=evidence.get(row.questId)?.verificationScore;return [missionHistoryEntry({...row,quest,verification:row.result==='COMPLETED'&&typeof quality==='number'&&Number.isFinite(quality)?quality:null})];}).sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));
}
export async function reconcileGameMaster(db:SQLiteDatabase,player:PlayerProfile,now:string,initialChoice?:CampaignChoice,choice?:CampaignChoice) {
 const row=await db.getFirstAsync<{value:string}>('SELECT value FROM app_state WHERE key=?',KEY);
 let campaign=decodeCampaign(row?.value??null,player.id,now,initialChoice);
 const history=await readMissionMemory(db);
 for(const outcome of history)campaign=recordMissionOutcome(campaign,outcome);
 if(choice){if(!['DISCIPLINE','MOTION','FOCUS'].includes(choice))throw new Error('GM_CHOICE_INVALID');campaign={...campaign,choice};}
 const value=JSON.stringify(campaign);
 if(row?.value!==value)await db.runAsync('INSERT INTO app_state(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',KEY,value);
 return {campaign,history};
}
