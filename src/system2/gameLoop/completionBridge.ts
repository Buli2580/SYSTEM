import type { InventoryItem } from '../core/inventory';
import type { RewardReceipt } from '../core/rewards';
import type { GameLoopState } from './stateMachine';
import { reduceGameLoop } from './stateMachine';
import { createRewardPresentation, type GameLoopRewardPresentation } from './presentation';

export type LoopCompletionResult={awarded:boolean;receipt?:RewardReceipt|null;loot?:InventoryItem|null};

export function applyCompletionToLoop(state:GameLoopState,result:LoopCompletionResult):{
 state:GameLoopState;presentation:GameLoopRewardPresentation|null;
}{
 if(!result.receipt){
  return {state:result.awarded?reduceGameLoop(state,'FAIL'):state,presentation:null};
 }
 return {
  state:reduceGameLoop(state,'COMPLETE',{rewardId:result.receipt.id,hasLoot:!!result.loot,levelUp:result.receipt.afterLevel>result.receipt.beforeLevel}),
  presentation:createRewardPresentation(result.receipt,result.loot??null),
 };
}
