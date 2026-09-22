import {useEffect,useState} from 'react';
import {useSystem} from '../state/SystemProvider';
import SystemBootSequence from './SystemBootSequence';

let shownForProcess=false;

export default function LaunchGate(){
  const {ready,onboardingComplete,player}=useSystem();
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    if(shownForProcess||!ready||!onboardingComplete)return;
    shownForProcess=true;
    setVisible(true);
  },[ready,onboardingComplete]);

  if(!visible)return null;
  return <SystemBootSequence visible player={player} onComplete={()=>setVisible(false)}/>;
}
