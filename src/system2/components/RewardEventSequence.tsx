import {useEffect,useMemo,useState} from 'react';
import {useSystem} from '../state/SystemProvider';
import SystemEventOverlay,{type SystemEvent} from './SystemEventOverlay';
import {presentationEventsFromReceipt} from '../presentation/events';

export default function RewardEventSequence(){
  const {lastReward,ready}=useSystem();
  const events=useMemo(()=>lastReward?presentationEventsFromReceipt(lastReward):[],[lastReward]);
  const [index,setIndex]=useState(0);
  useEffect(()=>setIndex(0),[lastReward?.id]);
  if(!ready||!events.length||index>=events.length)return null;
  const item=events[index];
  const event:SystemEvent={id:item.id,eyebrow:item.eyebrow,title:item.title,detail:item.detail,accent:item.accent,durationMs:item.kind==='QUEST_COMPLETE'?1800:2800};
  return <SystemEventOverlay event={event} onDismiss={()=>setIndex(i=>i+1)}/>;
}
