import AsyncStorage from '@react-native-async-storage/async-storage';import type {GoalCampaign} from './planner';const KEY='system.gm.history.v1';export type CampaignHistoryEntry={id:string;createdAt:string;campaign:GoalCampaign};export async function listCampaignHistory():Promise<CampaignHistoryEntry[]>{try{return JSON.parse(await AsyncStorage.getItem(KEY)||'[]')}catch{return[]}}export async function appendCampaignHistory(c:GoalCampaign){const rows=await listCampaignHistory();const entry={id:Date.now().toString(36),createdAt:new Date().toISOString(),campaign:c};await AsyncStorage.setItem(KEY,JSON.stringify([entry,...rows].slice(0,20)));return entry;}

import type { RunnableQuest } from '../quests/types';
import type { MissionOutcome } from './types';
import { QUEST_TEMPLATES, templateFor } from '../generation/templates';
const TECHNICAL = new Set(['GPS_ERROR','DATABASE_ERROR','APP_CRASH','TECHNICAL_ERROR','PROCESS_ENDED','PERMISSION_DENIED','BACKGROUND','DAY_ROLLOVER','LOW_CONFIDENCE']);
export function isTechnicalFailure(reason: string|null|undefined) { return !!reason && TECHNICAL.has(reason); }
export function semanticQuest(quest: RunnableQuest) {
 const template=templateFor(quest.id)??QUEST_TEMPLATES.find(t=>quest.templateId?.startsWith('g1_'+t.id+'_'));
 const minutes=quest.verification.type==='TIMER'?quest.verification.minimumDurationSeconds/60:quest.progressTarget/(quest.activityType==='BIKE'?240:quest.activityType==='RUN'?150:75);
 const family=template?.category??quest.activityType??quest.primarySkill;
 const difficulty=quest.adaptiveDifficulty??({EASY:1,NORMAL:2,HARD:3,EXTREME:4}[quest.difficulty]);
 const activity=quest.activityType??'FOCUS';
 const bucket=minutes<=5?5:minutes<=10?10:minutes<=20?20:40;
 // Identity ignores wording and IDs: paraphrases cannot bypass the cooldown.
 return {family,activity,stat:quest.primarySkill,difficulty,plannedMinutes:minutes,signature:[family,activity,quest.primarySkill,bucket,difficulty].join(':')};
}
export function missionHistoryEntry(input:{id:string;quest:RunnableQuest;at:string;result:string;reason:string|null;minutes:number;verification:number|null}):MissionOutcome {
 const result=input.result==='COMPLETED'?'COMPLETED':isTechnicalFailure(input.reason)?'TECHNICAL':input.result==='ABANDONED'?'ABANDONED':'FAILED';
 return {id:input.id,questId:input.quest.id,at:input.at,result,reason:input.reason,minutes:input.minutes,verification:input.verification,...semanticQuest(input.quest)};
}
