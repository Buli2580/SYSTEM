import {useCallback,useEffect,useRef,useState} from 'react';
import * as Location from 'expo-location';
import {createActivityWindow} from '../activity/features';
import {classifyActivity} from '../activity/classifier';
import type {ActivityEvidence} from '../activity/types';
import type {MoveQuest} from './types';
import {moveExpectedActivity,type MoveVerificationEvidence} from './verification';
import {moveHealthAvailable,readMoveHealth} from './health';
import {sumHealthSamples} from '../health/contract';

export type MoveRunStatus='READY'|'STARTING'|'TRACKING'|'VERIFYING'|'UNAVAILABLE'|'DENIED'|'ERROR';

export function useMoveVerification(quest:MoveQuest){
 const[status,setStatus]=useState<MoveRunStatus>('READY');
 const[elapsed,setElapsed]=useState(0);
 const[distance,setDistance]=useState(0);
 const[activity,setActivity]=useState<ActivityEvidence|null>(null);
 const[error,setError]=useState<string|null>(null);
 const startAt=useRef<number|null>(null);
 const tick=useRef<ReturnType<typeof setInterval>|null>(null);
 const watcher=useRef<Location.LocationSubscription|null>(null);
 const windowRef=useRef<ReturnType<typeof createActivityWindow>|null>(null);

 const cleanup=useCallback(()=>{if(tick.current)clearInterval(tick.current);tick.current=null;watcher.current?.remove();watcher.current=null;},[]);
 useEffect(()=>cleanup,[cleanup]);

 const update=useCallback(()=>{
  if(startAt.current===null)return;
  setElapsed(Math.max(0,Math.floor((Date.now()-startAt.current)/1000)));
  const features=windowRef.current?.features();
  if(features)setDistance(Math.round(features.distanceMeters));
 },[]);

 const start=useCallback(async()=>{
  cleanup();setError(null);setElapsed(0);setDistance(0);setActivity(null);setStatus('STARTING');
  startAt.current=Date.now();
  tick.current=setInterval(update,1000);
  if(quest.verification==='GPS_DISTANCE'||quest.verification==='MIXED'){
    const permission=await Location.requestForegroundPermissionsAsync();
    if(permission.status!=='granted'){cleanup();setStatus('DENIED');setError('MOVE wymaga dostępu do lokalizacji podczas tej misji.');return;}
    const w=createActivityWindow();windowRef.current=w;
    try{
      watcher.current=await Location.watchPositionAsync({
        accuracy:Location.Accuracy.High,
        timeInterval:1000,
        distanceInterval:3,
      },point=>{w.add(point);const f=w.features();setDistance(Math.round(f.distanceMeters));});
      setStatus('TRACKING');return;
    }catch{cleanup();setStatus('ERROR');setError('Nie udało się uruchomić GPS MOVE.');return;}
  }
  if(quest.verification==='STEPS'){
    if(!await moveHealthAvailable()){cleanup();setStatus('UNAVAILABLE');setError('Kroki wymagają Health Connect / Apple Health. Provider nie jest jeszcze dostępny na tym urządzeniu.');return;}
  }
  setStatus('TRACKING');
 },[cleanup,quest.verification,update]);

 const buildEvidence=useCallback(async(parentApproved=false):Promise<MoveVerificationEvidence>=>{
  if(startAt.current===null)throw new Error('MOVE_NOT_STARTED');
  setStatus('VERIFYING');update();
  const end=Date.now(),duration=Math.max(elapsed,Math.floor((end-startAt.current)/1000));
  if(quest.verification==='GPS_DISTANCE'||quest.verification==='MIXED'){
    const features=windowRef.current?.features();
    if(features){
      const classified=classifyActivity(moveExpectedActivity(quest),features);
      setActivity(classified);
      cleanup();
      return{questId:quest.id,durationSeconds:Math.max(duration,Math.floor(features.durationSeconds)),distanceMeters:features.distanceMeters,parentApproved,activity:classified,source:quest.verification==='MIXED'?'MIXED':'GPS'};
    }
  }
  if(quest.verification==='STEPS'){
    const startIso=new Date(startAt.current).toISOString(),endIso=new Date(end).toISOString();
    const rows=await readMoveHealth('STEPS',startIso,endIso);
    cleanup();
    return{questId:quest.id,durationSeconds:duration,steps:Math.floor(sumHealthSamples(rows)),source:'STEPS'};
  }
  cleanup();
  return{questId:quest.id,durationSeconds:duration,parentApproved,source:quest.verification==='PARENT_APPROVAL'?'PARENT':'TIMER'};
 },[cleanup,elapsed,quest]);

 return{status,elapsed,distance,activity,error,start,buildEvidence,running:status==='TRACKING'||status==='STARTING'};
}
