import type { PlayerProfile } from '../core/types';

export type LaunchVariant='FIRST_AWAKENING'|'RETURNING'|'VETERAN'|'ASCENDED';
export type LaunchBeat={at:number;text?:string;impact?:'LOW'|'MEDIUM'|'HIGH'};

export function launchVariant(player?:PlayerProfile|null,firstRun=false):LaunchVariant{
  if(firstRun||!player)return'FIRST_AWAKENING';
  if(player.realLevel>=100||player.rank==='ASCENDED')return'ASCENDED';
  if(player.realLevel>=25)return'VETERAN';
  return'RETURNING';
}
export function launchDuration(variant:LaunchVariant){
  return variant==='FIRST_AWAKENING'?7600:variant==='RETURNING'?2800:variant==='VETERAN'?3400:4000;
}
export function launchBeats(variant:LaunchVariant):LaunchBeat[]{
  if(variant==='FIRST_AWAKENING')return[
    {at:0,text:'SIGNAL DETECTED',impact:'LOW'},
    {at:1200,text:'SYSTEM ONLINE',impact:'MEDIUM'},
    {at:3000,text:'PLAYER DETECTED',impact:'HIGH'},
    {at:5000,text:'BEGIN AWAKENING',impact:'HIGH'},
  ];
  if(variant==='ASCENDED')return[
    {at:0,text:'SYSTEM ONLINE'},
    {at:900,text:'ASCENDED PLAYER DETECTED',impact:'HIGH'},
    {at:2200,text:'WORLD LINK RESTORED'},
  ];
  if(variant==='VETERAN')return[
    {at:0,text:'SYSTEM ONLINE'},
    {at:800,text:'VETERAN SIGNAL CONFIRMED'},
    {at:1900,text:'WELCOME BACK',impact:'MEDIUM'},
  ];
  return[
    {at:0,text:'SYSTEM ONLINE'},
    {at:700,text:'PLAYER DETECTED'},
    {at:1600,text:'WELCOME BACK'},
  ];
}
