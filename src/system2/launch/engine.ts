import type { PlayerProfile } from '../core/types';

export type LaunchVariant='FIRST_AWAKENING'|'RETURNING'|'VETERAN'|'ASCENDED';
export type LaunchBeat={at:number;text?:string;impact?:'LOW'|'MEDIUM'|'HIGH';phase?:'ONLINE'|'DETECTED'|'AWAKENING'|'WORLD'};

export function launchVariant(player?:PlayerProfile|null,firstRun=false):LaunchVariant{
  if(firstRun||!player)return'FIRST_AWAKENING';
  if(player.rank==='ASCENDED')return'ASCENDED';
  if(player.realLevel>=25)return'VETERAN';
  return'RETURNING';
}
export function launchDuration(variant:LaunchVariant){
  return variant==='FIRST_AWAKENING'?8200:variant==='RETURNING'?2400:variant==='VETERAN'?3200:3800;
}
export function launchBeats(variant:LaunchVariant):LaunchBeat[]{
  if(variant==='FIRST_AWAKENING')return[
    {at:0,text:'SYSTEM ONLINE',impact:'LOW',phase:'ONLINE'},
    {at:1500,text:'PLAYER DETECTED',impact:'MEDIUM',phase:'DETECTED'},
    {at:3600,text:'AWAKENING',impact:'HIGH',phase:'AWAKENING'},
    {at:6100,text:'WORLD LINK ESTABLISHED',impact:'HIGH',phase:'WORLD'},
  ];
  if(variant==='ASCENDED')return[
    {at:0,text:'SYSTEM ONLINE',phase:'ONLINE'},
    {at:700,text:'ASCENDED PLAYER DETECTED',impact:'HIGH',phase:'DETECTED'},
    {at:1900,text:'WORLD LINK // DOMINION',impact:'HIGH',phase:'WORLD'},
  ];
  if(variant==='VETERAN')return[
    {at:0,text:'SYSTEM ONLINE',phase:'ONLINE'},
    {at:650,text:'VETERAN PLAYER DETECTED',impact:'MEDIUM',phase:'DETECTED'},
    {at:1700,text:'WORLD LINK RESTORED',impact:'MEDIUM',phase:'WORLD'},
  ];
  return[
    {at:0,text:'SYSTEM ONLINE',phase:'ONLINE'},
    {at:650,text:'PLAYER DETECTED',phase:'DETECTED'},
    {at:1450,text:'WORLD LINK RESTORED',impact:'LOW',phase:'WORLD'},
  ];
}
