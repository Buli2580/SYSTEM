import {useCallback,useEffect,useMemo,useState} from 'react';
import {useSystem} from '../state/SystemProvider';
import SystemEventOverlay,{type SystemEvent} from './SystemEventOverlay';
import {presentationEventsFromReceipt} from '../presentation/events';

export default function RewardEventSequence(){
  const {lastReward,ready,dismissCelebration,awakeningPending}=useSystem();
  const events=useMemo(()=>lastReward?presentationEventsFromReceipt(lastReward):[],[lastReward]);
  const [index,setIndex]=useState(0);

  useEffect(()=>{
    if(awakeningPending){
      // Awakening owns the full-screen presentation for its completion reward.
      // Release the generic celebration gate so the two overlays never deadlock.
      setIndex(events.length);
      dismissCelebration();
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
