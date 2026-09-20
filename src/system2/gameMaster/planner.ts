import type { CampaignPlan, GameMasterContext, GeneratedQuest, PlayerGoal } from './contracts';

export interface GameMasterPolicy { maxDailyMinutes:number; maxQuestsPerDay:number; requireSelfVerification:boolean; }
export const DEFAULT_GAME_MASTER_POLICY:GameMasterPolicy={maxDailyMinutes:90,maxQuestsPerDay:3,requireSelfVerification:true};

function id(goal:PlayerGoal,index:number){ return `gm-${goal.id}-${index+1}`; }
export function buildOfflineCampaign(goal:PlayerGoal,context:GameMasterContext,policy=DEFAULT_GAME_MASTER_POLICY):CampaignPlan {
 const count=Math.max(1,Math.min(policy.maxQuestsPerDay,3));
 const minutes=Math.max(10,Math.floor(Math.min(policy.maxDailyMinutes,60)/count));
 const quests:GeneratedQuest[]=Array.from({length:count},(_,i)=>({
   id:id(goal,i), title:i===0?`Start: ${goal.title}`:`Step ${i+1}: ${goal.title}`,
   description:`Spend ${minutes} focused minutes moving this goal forward.`,
   domain:goal.domain, difficulty:Math.max(1,Math.min(5,Math.ceil(context.playerLevel/10)+(i>0?1:0))),
   xpReward:50+(i*25), verification:policy.requireSelfVerification?'self':'none'
 }));
 return { id:`campaign-${goal.id}`, goalId:goal.id, title:goal.title, generatedAt:new Date().toISOString(), modelVersion:'offline-planner-v1', quests };
}
export function validateCampaign(plan:CampaignPlan,policy=DEFAULT_GAME_MASTER_POLICY):string[] {
 const errors:string[]=[]; if(!plan.quests.length) errors.push('campaign_has_no_quests');
 if(plan.quests.length>policy.maxQuestsPerDay) errors.push('too_many_daily_quests');
 if(plan.quests.some(q=>q.xpReward<0)) errors.push('negative_xp_reward');
 return errors;
}
