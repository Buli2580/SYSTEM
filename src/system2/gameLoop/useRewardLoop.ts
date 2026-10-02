import {useCallback,useEffect,useRef,useState} from 'react';
import {gameLoopRewardPresentation,loadGameMasterMemory} from '../storage/database';
import {useSystem} from '../state/SystemProvider';
type Presentation=NonNullable<Awaited<ReturnType<typeof gameLoopRewardPresentation>>>;
export function useRewardLoop(){
 const {celebration,player,gameLoop,dismissCelebration,dismissLastReward}=useSystem();
 const [view,setView]=useState<Presentation|null>(null),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
 const epoch=useRef(0),lock=useRef(false);
 const publish=useCallback((next:Presentation|null)=>{
  setView(next);
  const phase=next?.steps[next.current]?.phase;
  if(next&&phase)gameLoop.observe({phase,questId:next.questId,rewardId:next.rewardId,recoverable:false});
 },[gameLoop.observe]);
 const refresh=useCallback(async()=>{
  const request=++epoch.current;
  if(!celebration){setView(null);return;}
  try{const next=await gameLoopRewardPresentation(celebration.id,undefined,player.id);if(request!==epoch.current)return;publish(next);setError(null);
   if(!next||next.current>=next.steps.length){dismissCelebration();dismissLastReward();}
  }catch{if(request===epoch.current)setError('Nie udało się odczytać zapisanej nagrody. Ponów odczyt.');}
 },[celebration?.id,player.id,publish,dismissCelebration,dismissLastReward]);
 useEffect(()=>{setView(null);void refresh();return()=>{epoch.current++;};},[refresh]);
 const advance=useCallback(async()=>{
  const step=view?.steps[view.current];if(!view||!step||lock.current)return false;
  lock.current=true;setBusy(true);const request=epoch.current;
  try{
   // Campaign reconciliation is idempotent and must succeed before leaving the outcome.
   if(step.phase==='WORLD_REACTION'||step.phase==='NEXT_QUEST')await loadGameMasterMemory(undefined,player.id);
   const next=await gameLoopRewardPresentation(view.rewardId,step.key,player.id);
   if(request!==epoch.current)return false;
   publish(next);setError(null);
   if(!next||next.current>=next.steps.length){dismissCelebration();dismissLastReward();}
   return true;
  }catch{if(request===epoch.current)setError('Nagroda jest zapisana. Nie udało się zapisać kroku prezentacji. Spróbuj ponownie.');return false;}
  finally{lock.current=false;if(request===epoch.current)setBusy(false);}
 },[view,player.id,publish,dismissCelebration,dismissLastReward]);
 return {view:view?.rewardId===celebration?.id?view:null,error,busy,advance,refresh};
}
