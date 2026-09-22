import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {useSystem} from '../state/SystemProvider';
import SystemEventOverlay,{type SystemEvent} from './SystemEventOverlay';
import {presentationEventsFromReceipt} from '../presentation/events';

export default function RewardEventSequence(){
  const {lastReward,ready,dismissCelebration,awakeningPending}=useSystem();
  const events=useMemo(()=>lastReward?presentationEventsFromReceipt(lastReward):[],[lastReward]);
  const [index,setIndex]=useState(0);
  const awakeningOwnedReward=useRef<string|null>(null);

  useEffect(()=>{
    if(awakeningPending&&lastReward?.id){
      // Awakening owns this receipt's full-screen presentation. Remember the
      // receipt so it is not replayed when awakeningPending is acknowledged.
      awakeningOwnedReward.current=lastReward.id;
      setIndex(events.length);
      dismissCelebration();
      return;
    }
    if(lastReward?.id&&awakeningOwnedReward.current===lastReward.id){
      setIndex(events.length);
      return;
    }
    setIndex(0);
  },[lastReward?.id,awakeningPending,events.length,dismissCelebration]);

  const dismiss=useCallback(()=>{
    setIndex(i=>{
      const next=i+1;
      if(next>=events.length)dismissCelebration();
      return next;
    });
  },[events.length,dismissCelebration]);

  if(!ready||awakeningPending||!events.length||index>=events.length)return null;
  const item=events[index];
  const event:SystemEvent={id:item.id,eyebrow:item.eyebrow,title:item.title,detail:item.detail,accent:item.accent,durationMs:item.kind==='QUEST_COMPLETE'?1800:2800};
  return <SystemEventOverlay event={event} onDismiss={dismiss}/>;
}
