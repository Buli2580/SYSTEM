import type * as Location from 'expo-location';
import {distanceBetween} from './gps';
import {antiCheat2Decision,type AntiCheat2Signal} from './antiCheat2';

export type GpsRiskSnapshot={signals:AntiCheat2Signal[];score:number;action:'ACCEPT'|'DOWNGRADE'|'REVIEW'|'REJECT'};

function pushUnique(signals:AntiCheat2Signal[],signal:AntiCheat2Signal){
  if(!signals.some(x=>x.kind===signal.kind&&x.severity===signal.severity))signals.push(signal);
}

export function inspectGpsRisk(previous:Location.LocationObject|null,current:Location.LocationObject,now=Date.now()):GpsRiskSnapshot{
 const signals:AntiCheat2Signal[]=[];
 if(current.mocked===true)pushUnique(signals,{kind:'MOCKED_LOCATION',severity:3});
 if(!Number.isFinite(current.timestamp)||current.timestamp>now+1000)pushUnique(signals,{kind:'CLOCK_SKEW',severity:3});
 if(now-current.timestamp>15000)pushUnique(signals,{kind:'SENSOR_GAP',severity:2});
 if(previous){
   const dt=(current.timestamp-previous.timestamp)/1000;
   if(dt<=0)pushUnique(signals,{kind:'CLOCK_SKEW',severity:2});
   else{
     const meters=distanceBetween(previous,current);
     const speed=meters/dt;
     if(meters>250&&dt<=15)pushUnique(signals,{kind:'TELEPORT',severity:3});
     else if(speed>12)pushUnique(signals,{kind:'IMPOSSIBLE_SPEED',severity:3});
     if(dt>30)pushUnique(signals,{kind:'BACKGROUND_JUMP',severity:2});
   }
 }
 const decision=antiCheat2Decision(signals);
 return{signals,score:decision.score,action:decision.action};
}

export function mergeRiskSnapshots(a:GpsRiskSnapshot,b:GpsRiskSnapshot):GpsRiskSnapshot{
 const signals=[...a.signals];
 for(const signal of b.signals)pushUnique(signals,signal);
 const decision=antiCheat2Decision(signals);
 return{signals,score:decision.score,action:decision.action};
}

export const EMPTY_GPS_RISK:GpsRiskSnapshot={signals:[],score:0,action:'ACCEPT'};
