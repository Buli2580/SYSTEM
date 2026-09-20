import type { GoalCategory, PlayerGoal } from '../goals/model';
import type { RunnableQuest } from '../quests/types';
import { templateFor } from '../generation/templates';
export type JourneyStage={name:string;milestone:string;actions:number;days:number;normal:number;xp:number};
export type Journey={id:string;goalId:string;category:GoalCategory;status:'ACTIVE'|'PAUSED'|'COMPLETED';currentStage:number;totalStages:number;createdAt:string;updatedAt:string;version:1;progress:{actions:number;days:string[];normal:number};completedStages:number[]};
const categoryDays:Record<GoalCategory,number>={FITNESS:3,STRENGTH:3,DISCIPLINE:3,PRODUCTIVITY:2,LEARNING:3,SOCIAL:2,LIFESTYLE:3,GENERAL:2};
export function journeyPlan(category:GoalCategory):JourneyStage[]{return [
 {name:'INITIATION',milestone:'FIRST STEP',actions:1,days:1,normal:0,xp:10},
 {name:'CONSISTENCY',milestone:'CONSISTENCY',actions:3,days:categoryDays[category],normal:0,xp:15},
 {name:'DEVELOPMENT',milestone:'MOMENTUM',actions:3,days:2,normal:1,xp:20},
 {name:'CHALLENGE',milestone:'BREAKTHROUGH',actions:3,days:2,normal:2,xp:25},
 {name:'MASTERY',milestone:'MASTERY',actions:4,days:categoryDays[category],normal:2,xp:30},
 ];}
export function newJourney(goal:PlayerGoal,now:string):Journey{return {id:'journey_v1:'+goal.id,goalId:goal.id,category:goal.category,status:goal.status==='ACTIVE'?'ACTIVE':'PAUSED',currentStage:0,totalStages:5,createdAt:now,updatedAt:now,version:1,progress:{actions:0,days:[],normal:0},completedStages:[]};}
export function primaryJourney(journeys:readonly Journey[],goals:readonly PlayerGoal[]){return journeys.filter(j=>j.status==='ACTIVE'&&goals.some(g=>g.id===j.goalId&&g.status==='ACTIVE')).slice().sort((a,b)=>(goals.find(g=>g.id===b.goalId)?.priority??0)-(goals.find(g=>g.id===a.goalId)?.priority??0)||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id))[0];}
export function contributesTo(quest:RunnableQuest,j:Journey){return quest.category==='DAILY'&&j.status==='ACTIVE'&&!!templateFor(quest.id)?.goals.includes(j.category);}
export function stageRequirement(j:Journey){const p=journeyPlan(j.category)[Math.min(j.currentStage,4)];return `${j.progress.actions}/${p.actions} sesji · ${j.progress.days.length}/${p.days} dni · ${j.progress.normal}/${p.normal} NORMAL/HARD`;}
