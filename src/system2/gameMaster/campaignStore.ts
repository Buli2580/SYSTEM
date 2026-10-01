import AsyncStorage from '@react-native-async-storage/async-storage';import type {GoalCampaign} from './planner';const KEY='system.gm.campaign.v1';export async function saveCampaign(c:GoalCampaign){await AsyncStorage.setItem(KEY,JSON.stringify(c));}export async function loadCampaign():Promise<GoalCampaign|null>{const raw=await AsyncStorage.getItem(KEY);if(!raw)return null;try{return JSON.parse(raw) as GoalCampaign}catch{return null}}export async function clearCampaign(){await AsyncStorage.removeItem(KEY);}

import type {CampaignState,CampaignChoice,MissionOutcome,CampaignView} from './types';
export function newCampaign(playerId:string,startedAt:string,choice:CampaignChoice='DISCIPLINE'):CampaignState {
 return {version:2,playerId,startedAt,choice,completed:[],lastQuest:null,lastOutcome:null,consequence:'NONE'};
}
export function decodeCampaign(raw:string|null,playerId:string,now:string,choice?:CampaignChoice):CampaignState {
 if(!raw)return newCampaign(playerId,now,choice);
 const c=JSON.parse(raw) as CampaignState;
 if(c.version!==2||c.playerId!==playerId||!Number.isFinite(Date.parse(c.startedAt))||!['DISCIPLINE','MOTION','FOCUS'].includes(c.choice)||!Array.isArray(c.completed)||c.completed.some(x=>typeof x!=='string')||!['NONE','PROGRESS','REST','RETRY'].includes(c.consequence)||!(c.lastQuest===null||typeof c.lastQuest==='string')||!(c.lastOutcome===null||Number.isFinite(Date.parse(c.lastOutcome))))throw new Error('GM_CAMPAIGN_INVALID');
 return c;
}
// Only records already committed by the canonical quest repository are passed here.
// No reward calculation and no mutation of quest state.
export function recordMissionOutcome(c:CampaignState,outcome:MissionOutcome):CampaignState {
 if(!Number.isFinite(Date.parse(outcome.at))||Date.parse(outcome.at)<Date.parse(c.startedAt))return c;
 const already=c.completed.includes(outcome.questId);
 const completed=outcome.result==='COMPLETED'&&!already?[...c.completed,outcome.questId]:c.completed;
 if(c.lastOutcome&&Date.parse(outcome.at)<Date.parse(c.lastOutcome))return {...c,completed};
 return {...c,completed,lastOutcome:outcome.at,lastQuest:outcome.result==='COMPLETED'?outcome.questId:c.lastQuest,
  consequence:outcome.result==='COMPLETED'?'PROGRESS':outcome.result==='TECHNICAL'?'RETRY':'REST'};
}
export function getCampaignState(c:CampaignState,now:string):CampaignView {
 const day=Math.max(1,Math.floor((Date.parse(now)-Date.parse(c.startedAt))/86400000)+1), cycleDay=(day-1)%30+1;
 const steps=c.completed.length,chapter=Math.floor(steps/10)+1,stage=steps%5+1;
 return {id:'campaign:'+c.startedAt,day,
 arc:'ARC '+chapter,chapter,chain:'CHAIN '+(Math.floor(steps/5)+1),stage,previousQuest:c.lastQuest,
 prepares:['Wykonaj krok w wybranym kierunku','Sprawdź rezultat i uporządkuj postęp','Utrwal wybrany kierunek','Podsumuj cykl i przygotuj Weekly','Następny łańcuch: zaplanuj kolejny krok'][stage-1],choice:c.choice,consequence:c.consequence,miniLength:5,mediumLength:10,longDays:30,longArc:'CAMPAIGN '+(Math.floor((day-1)/30)+1),phase:cycleDay<=7?'FOUNDATION':cycleDay<=14?'PRACTICE':cycleDay<=21?'CHALLENGE':'REVIEW'};
}
