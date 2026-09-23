import {useCallback,useEffect,useRef,useState} from 'react';
import * as Location from 'expo-location';
import {createActivityWindow} from '../activity/features';
import {classifyActivity} from '../activity/classifier';
import type {ActivityEvidence} from '../activity/types';
import type {MoveQuest} from './types';
import {moveExpectedActivity,type MoveVerificationEvidence} from './verification';
import {moveHealthAvailable,readMoveHealth} from './health';
import {sumHealthSamples} from '../health/contract';
import {createMoveSessionClock,moveElapsedMs,moveWallEndMs,type MoveSessionClock} from './sessionClock';

export type MoveRunStatus='READY'|'STARTING'|'TRACKING'|'VERIFYING'|'UNAVAILABLE'|'DENIED'|'ERROR';

export function useMoveVerification(quest:MoveQuest){
 const[status,setStatus]=useState<MoveRunStatus>('READY');
 const[elapsed,setElapsed]=useState(0);
 const[distance,setDistance]=useState(0);
 const[activity,setActivity]=useState<ActivityEvidence|null>(null);
 const[error,setError]=useState<string|null>(null);
 const sessionRef=useRef<MoveSessionClock|null>(null);
 const tick=useRef<ReturnType<typeof setInterval>|null>(null);
 const watcher=useRef<Location.LocationSubscription|null>(null);
 const windowRef=useRef<ReturnType<typeof createActivityWindow>|null>(null);
 // Every async permission/provider/watcher continuation checks its generation.
 // A late native subscription must be removed, never installed after reset/unmount.
 const generation=useRef(0);
 const mounted=useRef(true);

 const cleanup=useCallback(()=>{
  if(tick.current!==null)clearInterval(tick.current);
  tick.current=null;
  watcher.current?.remove();
  watcher.current=null;
 },[]);
 useEffect(()=>{
  mounted.current=true;
  return()=>{mounted.current=false;generation.current++;cleanup();sessionRef.current=null;};
 },[cleanup]);

 const update=useCallback(()=>{
  const session=sessionRef.current;
  if(!session)return;
  try{
   setElapsed(Math.floor(moveElapsedMs(session,performance.now())/1000));
  }catch{
   generation.current++;
   cleanup();
   sessionRef.current=null;
   setStatus('ERROR');
   setError('Zegar sesji MOVE został zresetowany. Uruchom misję ponownie.');
   return;
  }
  const features=windowRef.current?.features();
  if(features)setDistance(Math.round(features.distanceMeters));
 },[cleanup]);

 const start=useCallback(async()=>{
  const run=++generation.current;
  cleanup();
  sessionRef.current=null;
  windowRef.current=null;
  setError(null);setElapsed(0);setDistance(0);setActivity(null);setStatus('STARTING');
  const live=()=>mounted.current&&generation.current===run;
  const beginTracking=()=>{
   if(!live())return;
   // Never credit time spent in the Android permission dialog or waiting
   // for a native GPS subscription/health provider to initialize.
   sessionRef.current=createMoveSessionClock(Date.now(),performance.now());
   tick.current=setInterval(update,1000);
   setStatus('TRACKING');
  };
  if(quest.verification==='GPS_DISTANCE'||quest.verification==='MIXED'){
   try{
    const permission=await Location.requestForegroundPermissionsAsync();
    if(!live())return;
    if(permission.status!=='granted'){
     cleanup();sessionRef.current=null;setStatus('DENIED');
     setError('MOVE wymaga dostępu do lokalizacji podczas tej misji.');return;
    }
    const window=createActivityWindow();
    windowRef.current=window;
    const subscription=await Location.watchPositionAsync({
     accuracy:Location.Accuracy.High,
     timeInterval:1000,
     distanceInterval:3,
    },point=>{
     if(!live()||sessionRef.current===null)return;
     window.add(point);
     const features=window.features();
     setDistance(Math.round(features.distanceMeters));
    });
    if(!live()){subscription.remove();return;}
    watcher.current=subscription;
    beginTracking();
   }catch{
    if(!live())return;
    cleanup();sessionRef.current=null;setStatus('ERROR');
    setError('Nie udało się uruchomić GPS MOVE.');
   }
   return;
  }
  if(quest.verification==='STEPS'||quest.verification==='HEALTH'){
   try{
    const available=await moveHealthAvailable();
    if(!live())return;
    if(!available){
     cleanup();sessionRef.current=null;setStatus('UNAVAILABLE');
     setError('Kroki wymagają Health Connect / Apple Health. Provider nie jest jeszcze dostępny na tym urządzeniu.');
     return;
    }
   }catch{
    if(!live())return;
    cleanup();sessionRef.current=null;setStatus('ERROR');
    setError('Nie udało się sprawdzić dostawcy danych zdrowotnych.');return;
   }
  }
  beginTracking();
 },[cleanup,quest.verification,update]);

 const buildEvidence=useCallback(async(parentApproved=false):Promise<MoveVerificationEvidence>=>{
  const session=sessionRef.current;
  if(!session||status!=='TRACKING')throw new Error('MOVE_NOT_TRACKING');
  // Cancels late native subscriptions and prevents another start from
  // publishing stale evidence. Time credit never depends on Date.now().
  const run=++generation.current;
  setStatus('VERIFYING');
  try{
   const endMono=performance.now();
   const duration=Math.floor(moveElapsedMs(session,endMono)/1000);
   if(quest.verification==='GPS_DISTANCE'||quest.verification==='MIXED'){
    const features=windowRef.current?.features();
    if(features){
     const classified=classifyActivity(moveExpectedActivity(quest),features);
     if(mounted.current&&run===generation.current)setActivity(classified);
     return{questId:quest.id,durationSeconds:Math.max(duration,Math.floor(features.durationSeconds)),distanceMeters:features.distanceMeters,parentApproved,activity:classified,source:quest.verification==='MIXED'?'MIXED':'GPS'};
    }
   }
   if(quest.verification==='STEPS'||quest.verification==='HEALTH'){
    const startIso=new Date(session.startedAtWallMs).toISOString();
    const endIso=new Date(moveWallEndMs(session,endMono)).toISOString();
    const metric=quest.verification==='STEPS'?'STEPS':'ACTIVE_MINUTES';
    const rows=await readMoveHealth(metric,startIso,endIso);
    if(!mounted.current||run!==generation.current)throw new Error('MOVE_CANCELLED');
    return quest.verification==='STEPS'
     ?{questId:quest.id,durationSeconds:duration,steps:Math.floor(sumHealthSamples(rows)),source:'STEPS'}
     :{questId:quest.id,durationSeconds:duration,activeMinutes:Math.floor(sumHealthSamples(rows)),source:'HEALTH'};
   }
   return{questId:quest.id,durationSeconds:duration,parentApproved,source:quest.verification==='PARENT_APPROVAL'?'PARENT':'TIMER'};
  }catch(error){
   if(mounted.current&&run===generation.current){
    setStatus('ERROR');
    setError('Nie udało się zweryfikować sesji MOVE. Spróbuj ponownie.');
   }
   throw error;
  }finally{
   if(run===generation.current){
    cleanup();
    sessionRef.current=null;
   }
  }
 },[cleanup,quest,status]);

 const reset=useCallback(()=>{
  generation.current++;
  cleanup();sessionRef.current=null;windowRef.current=null;
  setStatus('READY');setError(null);setElapsed(0);setDistance(0);setActivity(null);
 },[cleanup]);
 return{status,elapsed,distance,activity,error,start,buildEvidence,reset,running:status==='TRACKING'||status==='STARTING'};
}
