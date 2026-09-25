import {useCallback,useEffect,useState} from 'react';
import {Modal,View} from 'react-native';
import {useSystem} from '../state/SystemProvider';
import SystemBootSequence from './SystemBootSequence';

let shownForProcess=false;

export default function LaunchGate(){
  const {ready,onboardingComplete,awakeningCompleted,player}=useSystem();
  const [visible,setVisible]=useState(false);
  const dismiss=useCallback(()=>setVisible(false),[]);

  useEffect(()=>{
    if(shownForProcess||!ready)return;
    if(!onboardingComplete){
      // The onboarding screen already plays the first-run cinematic.
      shownForProcess=true;
      return;
    }
    shownForProcess=true;
    setVisible(true);
  },[ready,onboardingComplete]);

  return <Modal visible={visible} animationType="none" onRequestClose={dismiss}>
    <View style={{flex:1,backgroundColor:'#010305'}}>
      {visible&&<SystemBootSequence visible firstRun={!awakeningCompleted} player={player} onComplete={dismiss}/>}
    </View>
  </Modal>;
}
