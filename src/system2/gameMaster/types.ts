import type { RunnableQuest } from '../quests/types';
import type { SkillKey } from '../core';
export type MissionOutcome = {
 id: string; questId: string; at: string;
 result: 'COMPLETED'|'FAILED'|'ABANDONED'|'TECHNICAL';
 reason: string|null; activity: string; family: string; stat: SkillKey;
 difficulty: number; minutes: number; plannedMinutes: number;
 verification: number|null; signature: string;
};
export type CampaignChoice = 'DISCIPLINE'|'MOTION'|'FOCUS';
export type CampaignState = {
 version: 2; playerId: string; startedAt: string; choice: CampaignChoice;
 completed: string[]; lastQuest: string|null; lastOutcome: string|null;
 consequence: 'NONE'|'PROGRESS'|'REST'|'RETRY';
};
export type WorldReaction='NORMAL'|'TENSION'|'THREAT'|'BOSS'|'RECOVERY'|'COMEBACK'|'VICTORY'|'AWAKENING';
export type CharacterReaction='IDLE'|'READY'|'TIRED'|'RECOVERY'|'VICTORY'|'THREAT'|'LEVEL_UP'|'LOOT';
export type WorldDirectives={reaction:WorldReaction;threat:0|1|2|3;weather:'CLEAR'|'MIST'|'ASH';lighting:'DAY'|'NIGHT'|'WARM';tier:1|2|3;missionSignal:string|null};
export type BossDirectives={presence:boolean;threat:0|1|2|3;reaction:'DORMANT'|'WATCHING'|'CHALLENGE'|'DEFEATED';campaignRelevance:string;source:'STORY'|'WORLD_EVENT'|'NONE'};
export type CampaignView={id:string;day:number;arc:string;chapter:number;chain:string;stage:number;previousQuest:string|null;prepares:string;choice:CampaignChoice;consequence:CampaignState['consequence'];miniLength:5;mediumLength:10;longDays:30;longArc:string;phase:'FOUNDATION'|'PRACTICE'|'CHALLENGE'|'REVIEW'};
export type MissionDirective={quest:RunnableQuest|null;reason:string;campaign:CampaignView;difficulty:number;readiness:number;recovery:boolean;comeback:boolean;diversity:number;nextPossibleQuestIds:string[]};
