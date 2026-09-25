import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {useSystem} from '../state/SystemProvider';
import SystemEventOverlay,{type SystemEvent} from './SystemEventOverlay';
import {presentationEventsFromReceipt} from '../presentation/events';
import MilestoneCardOverlay from '../cards/MilestoneCardOverlay';
import type {CardReason} from '../cards/engine';
import CombatImpactOverlay from './CombatImpactOverlay';
import {motion4EventDuration} from '../presentation/animation4';
import {useAnimation4} from '../presentation/useAnimation4';

export default function RewardEventSequence(){
  const motion=useAnimation4();
  const {lastReward,ready,dismissCelebration,awakeningPending,player}=useSystem();
  const events=useMemo(()=>lastReward?presentationEventsFromReceipt(lastReward):[],[lastReward]);
  const [index,setIndex]=useState(0);
  const cardReason:CardReason|null=lastReward?.newTitles.includes('WALLBREAKER')?'BOSS':lastReward?.newTitles.includes('AWAKENED')?'AWAKENING':lastReward&&lastReward.afterRank!==lastReward.beforeRank?'RANK_UP':lastReward&&lastReward.afterLevel>lastReward.beforeLevel?'LEVEL_UP':null;
  const awakeningOwnedReward=useRef<string|null>(null);

  const combatCount=lastReward?.bossDamage?1:0;
  const total=combatCount+events.length+(cardReason?1:0);

  useEffect(()=>{
    if(awakeningPending&&lastReward?.id){
      // Awakening owns this receipt's full-screen presentation. Remember the
      // receipt so it is not replayed when awakeningPending is acknowledged.
      awakeningOwnedReward.current=lastReward.id;
      setIndex(total);
      dismissCelebration();
      return;
    }
    if(lastReward?.id&&awakeningOwnedReward.current===lastReward.id){
      setIndex(total);
      return;
    }
    setIndex(0);
  },[lastReward?.id,awakeningPending,total,dismissCelebration]);

  const dismiss=useCallback(()=>{
    setIndex(i=>{
      const next=i+1;
      if(next>=total)dismissCelebration();
      return next;
    });
  },[total,dismissCelebration]);

  if(!ready||awakeningPending||!lastReward||index>=total)return null;
  if(lastReward.bossDamage&&index===0)return <CombatImpactOverlay damage={lastReward.bossDamage} onDismiss={dismiss}/>;
  const eventIndex=index-combatCount;
  if(eventIndex>=events.length&&cardReason)return <MilestoneCardOverlay player={player} reason={cardReason} onDismiss={dismiss}/>;
  const item=events[eventIndex];
  if(!item)return null;
  const event:SystemEvent={id:item.id,eyebrow:item.eyebrow,title:item.title,detail:item.detail,accent:item.accent,durationMs:motion4EventDuration(item.kind,motion.reduced)};
  return <SystemEventOverlay event={event} onDismiss={dismiss}/>;
}
