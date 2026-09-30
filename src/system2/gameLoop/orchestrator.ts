import type { RewardReceipt } from '../core/rewards';
import { INITIAL_GAME_LOOP_STATE, reduceGameLoop, type GameLoopEvent, type GameLoopState } from './stateMachine';
import { checkpoint, type GameLoopCheckpoint } from './recovery';

export type GameLoopSnapshot = { state: GameLoopState; checkpoint: GameLoopCheckpoint };
export class GameLoopOrchestrator {
  private current: GameLoopState;
  constructor(initial: GameLoopState = INITIAL_GAME_LOOP_STATE) { this.current = initial; }
  get state(): GameLoopState { return this.current; }
  dispatch(event: GameLoopEvent, payload?: {questId?:string;rewardId?:string;levelUp?:boolean;hasLoot?:boolean}): GameLoopSnapshot {
    this.current = reduceGameLoop(this.current,event,payload);
    return { state:this.current, checkpoint:checkpoint(this.current) };
  }
  acceptQuest(questId:string){ return this.dispatch('SELECT_QUEST',{questId}); }
  completed(receipt:RewardReceipt,hasLoot:boolean){ return this.dispatch('COMPLETE',{rewardId:receipt.id,levelUp:receipt.afterLevel>receipt.beforeLevel,hasLoot}); }
  fail(){ return this.dispatch('FAIL'); }
}
