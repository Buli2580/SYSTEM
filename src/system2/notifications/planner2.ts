import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import {awaitWithTimeout} from '../storage/awaitWithTimeout';
import {planBlockDue,type CustomPlanBlock} from '../planning/storage';

const PREFIX='system2-plan-';
const CHANNEL='system2-planner';

async function ensureChannel(){
 if(Platform.OS!=='android')return;
 await awaitWithTimeout(Notifications.setNotificationChannelAsync(CHANNEL,{
  name:'SYSTEM Planner',
  importance:Notifications.AndroidImportance.DEFAULT,
 }));
}
export async function requestPlannerReminderPermission(){
 await ensureChannel();
 return (await awaitWithTimeout(Notifications.requestPermissionsAsync())).granted;
}
function localDate(dayOffset:number,time:string){
 const [hour,minute]=time.split(':').map(Number);
 const d=new Date();
 d.setDate(d.getDate()+dayOffset);
 d.setHours(hour,minute,0,0);
 return d;
}
export async function syncPlannerBlockReminders(blocks:CustomPlanBlock[],days=7,minutesBefore=10){
 await ensureChannel();
 const permission=await awaitWithTimeout(Notifications.getPermissionsAsync());
 if(!permission.granted)throw new Error('Włącz zgodę na powiadomienia, aby Planner mógł przypominać o blokach.');
 const scheduled=await awaitWithTimeout(Notifications.getAllScheduledNotificationsAsync());
 for(const row of scheduled){
  if(row.identifier.startsWith(PREFIX))await awaitWithTimeout(Notifications.cancelScheduledNotificationAsync(row.identifier));
 }
 const now=Date.now(),safeDays=Math.max(1,Math.min(14,Math.floor(days))),lead=Math.max(0,Math.min(120,Math.floor(minutesBefore)));
 let count=0;
 for(let offset=0;offset<safeDays;offset++){
  for(const block of blocks.slice(0,30)){
   const start=localDate(offset,block.time);
   if(!planBlockDue(block,start))continue;
   const fire=new Date(start.getTime()-lead*60000);
   if(fire.getTime()<=now)continue;
   const key=start.toISOString().slice(0,10);
   await awaitWithTimeout(Notifications.scheduleNotificationAsync({
    identifier:PREFIX+block.id+'-'+key,
    content:{
      title:'SYSTEM // '+block.kind,
      body:lead>0?block.title+' za '+lead+' min.':block.title+' zaczyna się teraz.',
      data:{plannerBlockId:block.id,plannerKind:block.kind,startAt:start.toISOString()},
    },
    trigger:{
      type:Notifications.SchedulableTriggerInputTypes.DATE,
      date:fire,
      ...(Platform.OS==='android'?{channelId:CHANNEL}:{}),
    },
   }));
   count++;
  }
 }
 return count;
}
export async function clearPlannerBlockReminders(){
 const scheduled=await awaitWithTimeout(Notifications.getAllScheduledNotificationsAsync());
 let count=0;
 for(const row of scheduled){
  if(row.identifier.startsWith(PREFIX)){await awaitWithTimeout(Notifications.cancelScheduledNotificationAsync(row.identifier));count++;}
 }
 return count;
}
