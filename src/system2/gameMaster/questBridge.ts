import type {GoalCampaign,CampaignQuest} from './planner';
export type GeneratedQuest={id:string;title:string;description:string;estimatedMinutes:number;source:'GAME_MASTER_PREVIEW';campaignGoal:string};
export function campaignQuestToGenerated(c:GoalCampaign,q:CampaignQuest):GeneratedQuest{return{id:'gm:'+q.id,title:q.title,description:q.description,estimatedMinutes:q.minutes,source:'GAME_MASTER_PREVIEW',campaignGoal:c.goal};}
export function campaignToGeneratedQuests(c:GoalCampaign){return c.daily.map(q=>campaignQuestToGenerated(c,q));}
