import {useCallback,useRef,useState} from 'react';
import {queueTelemetry} from '../telemetry/amplitude';
import {loopSignal} from './telemetry';
import {questRunLoopState,type QuestRunStatus} from './questRunAdapter';
import {INITIAL_GAME_LOOP_STATE,type GameLoopState} from './stateMachine';
/** Presentation observer only. Canonical quest sessions and rewards stay in SQLite. */
export function useGameLoopController(playerId:string){
 const [observed,setObserved]=useState<{playerId:string;state:GameLoopState}|null>(null);
 const last=useRef('');
 const current=useRef({playerId,state:INITIAL_GAME_LOOP_STATE});
 const observe=useCallback((state:GameLoopState)=>{
  const key=JSON.stringify([playerId,state]);if(last.current===key)return;
  last.current=key;current.current={playerId,state};setObserved({playerId,state});
  const signal=loopSignal(state.phase,{questId:state.questId??undefined});
  void queueTelemetry({event_type:signal.event,event_properties:{phase:state.phase,...(state.questId?{questId:state.questId}:{}),...(state.rewardId?{rewardId:state.rewardId}:{})}}).catch(()=>undefined);
 },[playerId]);
 const observeQuest=useCallback((status:QuestRunStatus,questId:string)=>{
  if(status==='COMPLETED'&&current.current.playerId===playerId&&current.current.state.rewardId)return;
  observe(questRunLoopState(status,questId));
 },[observe,playerId]);
 return {state:observed?.playerId===playerId?observed.state:INITIAL_GAME_LOOP_STATE,observe,observeQuest};
}
