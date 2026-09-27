import type { PlayerProfile } from '../core/types';

export type WorldEventKind='PORTAL_OPENED'|'INVASION'|'ELITE_ENEMY'|'ANOMALY'|'RELIC_SIGNAL'|'MINI_BOSS';
export type WorldEventThreat=1|2|3;
export type WorldEvent={
  id:string;
  kind:WorldEventKind;
  title:string;
  subtitle:string;
  sector:string;
  startsAt:string;
  endsAt:string;
  threat:WorldEventThreat;
  rewardTag:'XP'|'CARD'|'RELIC'|'BOSS_DAMAGE';
  recommendedAction:'FOCUS'|'MOVE'|'EXPLORE'|'BOSS';
};

const EVENT_ROTATION:readonly Omit<WorldEvent,'id'|'sector'|'startsAt'|'endsAt'>[]=[
  {kind:'ANOMALY',title:'SECTOR ANOMALY',subtitle:'Niestabilny sygnał pojawił się w warstwie świata.',threat:2,rewardTag:'RELIC',recommendedAction:'EXPLORE'},
  {kind:'PORTAL_OPENED',title:'PORTAL OPENED',subtitle:'Krótki portal aktywny. SYSTEM zaleca szybką reakcję.',threat:2,rewardTag:'CARD',recommendedAction:'MOVE'},
  {kind:'ELITE_ENEMY',title:'ELITE SIGNAL',subtitle:'W sektorze wykryto silniejszy byt.',threat:3,rewardTag:'BOSS_DAMAGE',recommendedAction:'BOSS'},
  {kind:'RELIC_SIGNAL',title:'RELIC SIGNAL',subtitle:'Rzadki sygnał reliktu jest dostępny przez ograniczony czas.',threat:1,rewardTag:'RELIC',recommendedAction:'EXPLORE'},
  {kind:'INVASION',title:'SECTOR INVASION',subtitle:'Aktywność przeciwnika wzrosła. Zweryfikowane działania osłabią zagrożenie.',threat:3,rewardTag:'XP',recommendedAction:'MOVE'},
  {kind:'MINI_BOSS',title:'LOCAL MINI-BOSS',subtitle:'Lokalny cel wysokiego zagrożenia wszedł do sektora.',threat:3,rewardTag:'CARD',recommendedAction:'BOSS'},
];

function hash(text:string){
  let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}

function sectorLabel(player:PlayerProfile){
  return player.discoveredSectors>0?'DISCOVERED-'+Math.max(1,player.discoveredSectors):'HOME-SECTOR';
}

export function activeWorldEvent(player:PlayerProfile,worldUnlocked:boolean,now=Date.now()):WorldEvent|null{
  if(!worldUnlocked)return null;
  const d=new Date(now);
  const day=d.toISOString().slice(0,10);
  const window=Math.floor(d.getUTCHours()/3); // eight deterministic 3h windows/day
  const seed=hash(player.id+day+window);
  // Not every window contains an event. Higher exploration slightly increases frequency.
  const threshold=Math.min(78,38+player.discoveredSectors*3+Math.min(20,player.realLevel));
  if(seed%100>=threshold)return null;
  const base=EVENT_ROTATION[seed%EVENT_ROTATION.length];
  const start=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),window*3,0,0,0));
  const end=new Date(start.getTime()+3*60*60*1000);
  return {
    ...base,
    id:'world-event:'+day+':'+window+':'+base.kind,
    sector:sectorLabel(player),
    startsAt:start.toISOString(),
    endsAt:end.toISOString(),
  };
}

export function worldEventRemainingMs(event:WorldEvent,now=Date.now()){
  return Math.max(0,new Date(event.endsAt).getTime()-now);
}
export function formatWorldEventRemaining(event:WorldEvent,now=Date.now()){
  const ms=worldEventRemainingMs(event,now);
  const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
  return h>0?`${h}H ${String(m).padStart(2,'0')}MIN`:`${m}MIN`;
}
export function worldEventDirectorLine(event:WorldEvent,now=Date.now()){
  return `${event.title} // ${formatWorldEventRemaining(event,now)}`;
}
