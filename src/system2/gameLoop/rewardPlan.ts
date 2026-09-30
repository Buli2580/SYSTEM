import type { RewardReceipt } from '../core/rewards';
import type { GameLoopPhase } from './stateMachine';

export type RewardPresentationStep={phase:GameLoopPhase;key:string;required:boolean};
export function buildRewardPresentationPlan(receipt:RewardReceipt,hasLoot:boolean):RewardPresentationStep[]{
 const levelUp=receipt.afterLevel>receipt.beforeLevel;
 const steps:RewardPresentationStep[]=[
  {phase:'XP_REWARD',key:receipt.id+':xp',required:true},
  {phase:'LOOT_REWARD',key:receipt.id+':loot',required:hasLoot},
  {phase:'LEVEL_UP',key:receipt.id+':level',required:levelUp},
  {phase:'EQUIP',key:receipt.id+':equip',required:hasLoot},
  {phase:'WORLD_REACTION',key:receipt.id+':world',required:true},
  {phase:'NEXT_QUEST',key:receipt.id+':next',required:true},
 ];
 return steps.filter(x=>x.required);
}
