import type { PlayerGoal } from './contracts';
export type GoalSafetyDecision={allowed:true}|{allowed:false;reason:string};
const HIGH_RISK=/suicide|samobój|self[- ]?harm|samookalecz|overdose|przedawk|starv|głodów/i;
export function assessGoalSafety(goal:PlayerGoal):GoalSafetyDecision {
 const text=`${goal.title} ${goal.description ?? ''}`;
 return HIGH_RISK.test(text)?{allowed:false,reason:'high_risk_goal_requires_safe_handling'}:{allowed:true};
}
