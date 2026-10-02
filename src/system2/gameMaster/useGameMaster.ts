import {queueTelemetry} from '../telemetry/amplitude';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {loadGameMasterMemory} from '../storage/database';
import {newCampaign} from './campaignStore';
import {getGameMasterState,type GameMasterInput} from './runtime';
import type {CampaignChoice,CampaignState,MissionOutcome} from './types';
export function useGameMaster(input:Omit<GameMasterInput,'campaign'|'history'|'now'> & {ready:boolean}) {
 const [memory,setMemory]=useState<{campaign:CampaignState;history:MissionOutcome[]}|null>(null);
 const [error,setError]=useState<string|null>(null);
 const epoch=useRef(0);
 const refresh=useCallback(async (choice?:CampaignChoice)=>{
  const request=++epoch.current;
  try {const value=await loadGameMasterMemory(choice,input.player.id);if(request===epoch.current){setMemory(value);setError(null);}}
  catch {if(request===epoch.current)setError('Nie udało się odczytać pamięci kampanii. Działa lokalny wybór misji.');}
 },[input.player.id]);
 useFocusEffect(useCallback(()=>{
  if(input.ready)void refresh();
  return ()=>{epoch.current++;};
 },[input.ready,input.player.id,input.daily?.dayKey,input.completedQuestIds.length,input.recentAttempt,refresh]));
 const now=new Date().toISOString();
 const valid=memory?.campaign.playerId===input.player.id?memory:null;
 const state=getGameMasterState({...input,now,campaign:valid?.campaign??newCampaign(input.player.id,now,input.gameMasterProfile?.path),history:valid?.history??[]});
 const fingerprint=JSON.stringify(state.telemetry);
 const lastTelemetry=useRef<string|null>(null);
 useEffect(()=>{
  if(!input.ready||lastTelemetry.current===fingerprint)return;
  lastTelemetry.current=fingerprint;
  void queueTelemetry({event_type:'GM_DECISION',event_properties:state.telemetry}).catch(()=>{});
  if(state.mission.comeback)void queueTelemetry({event_type:'GM_COMEBACK',event_properties:state.telemetry}).catch(()=>{});
  if(state.mission.recovery)void queueTelemetry({event_type:'GM_RECOVERY_QUEST',event_properties:state.telemetry}).catch(()=>{});
  void queueTelemetry({event_type:'GM_FALLBACK',event_properties:{...state.telemetry,source:'LOCAL_CANONICAL'}}).catch(()=>{});
 },[input.ready,fingerprint]);
 return {state,error,refresh};
}
