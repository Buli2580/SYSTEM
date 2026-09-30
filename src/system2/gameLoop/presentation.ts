import type { InventoryItem } from '../core/inventory';
import type { RewardReceipt } from '../core/rewards';
import { buildRewardPresentationPlan } from './rewardPlan';

export type GameLoopRewardPresentation={
 rewardId:string;
 receipt:RewardReceipt;
 loot:InventoryItem|null;
 steps:ReturnType<typeof buildRewardPresentationPlan>;
 current:number;
};

export function createRewardPresentation(receipt:RewardReceipt,loot:InventoryItem|null):GameLoopRewardPresentation{
 return {rewardId:receipt.id,receipt,loot,steps:buildRewardPresentationPlan(receipt,Boolean(loot)),current:0};
}
export function currentRewardStep(value:GameLoopRewardPresentation){return value.steps[value.current]??null;}
export function advanceRewardPresentation(value:GameLoopRewardPresentation):GameLoopRewardPresentation{
 return {...value,current:Math.min(value.current+1,value.steps.length)};
}
export function rewardPresentationComplete(value:GameLoopRewardPresentation){return value.current>=value.steps.length;}
export function rewardPresentationProgress(value:GameLoopRewardPresentation){
 return value.steps.length===0?1:Math.min(1,value.current/value.steps.length);
}
