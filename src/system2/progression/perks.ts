import type { PlayerProfile, SkillKey } from '../core/types';
import type { QuestDifficulty } from '../core/types';

export type PlayerArchetype='VANGUARD'|'TACTICIAN'|'HUNTER'|'CREATOR'|'ADAPTIVE';
export type PerkId='FOCUS_SURGE'|'SECOND_WIND'|'PATHFINDER'|'BOSS_BREAKER'|'DISCIPLINE_CORE'|'DOUBLE_IMPACT';
export type PlayerPerk={
  id:PerkId;
  title:string;
  description:string;
  unlocked:boolean;
  active:boolean;
  unlockReason:string;
};

function level(player:PlayerProfile,key:SkillKey){return player.stats[key].level}

export function archetypeForPlayer(player:PlayerProfile):PlayerArchetype{
  const strVit=level(player,'STR')+level(player,'VIT');
  const intWil=level(player,'INT')+level(player,'WIL');
  const wilRes=level(player,'WIL')+level(player,'RES');
  const chaCre=level(player,'CHA')+level(player,'CRE');
  const max=Math.max(strVit,intWil,wilRes,chaCre);
  const min=Math.min(strVit,intWil,wilRes,chaCre);
  if(max-min<=2)return'ADAPTIVE';
  if(max===strVit)return'VANGUARD';
  if(max===intWil)return'TACTICIAN';
  if(max===wilRes)return'HUNTER';
  return'CREATOR';
}

export function playerPerks(player:PlayerProfile,failedRecently=false):PlayerPerk[]{
  const streak=player.streak;
  return[
    {id:'FOCUS_SURGE',title:'FOCUS SURGE',description:'Zweryfikowany Focus wzmacnia następny cios w bossa.',unlocked:level(player,'WIL')>=3,active:level(player,'WIL')>=3,unlockReason:'WIL LV.3'},
    {id:'SECOND_WIND',title:'SECOND WIND',description:'Po serii niepowodzeń SYSTEM preferuje łagodny recovery quest.',unlocked:player.realLevel>=3,active:player.realLevel>=3&&failedRecently,unlockReason:'REAL LV.3'},
    {id:'PATHFINDER',title:'PATHFINDER',description:'Eksploracja zwiększa częstotliwość World Events.',unlocked:player.discoveredSectors>=3,active:player.discoveredSectors>=3,unlockReason:'3 SECTORS'},
    {id:'BOSS_BREAKER',title:'BOSS BREAKER',description:'HARD quest zadaje dodatkowe obrażenia bossowi.',unlocked:level(player,'STR')>=4||level(player,'VIT')>=4,active:level(player,'STR')>=4||level(player,'VIT')>=4,unlockReason:'STR/VIT LV.4'},
    {id:'DISCIPLINE_CORE',title:'DISCIPLINE CORE',description:'Milestone streak wzmacnia następny dzień SYSTEMU.',unlocked:streak>=14,active:streak>=14,unlockReason:'14 DAY STREAK'},
    {id:'DOUBLE_IMPACT',title:'DOUBLE IMPACT',description:'Raz na tydzień ważna misja może podwoić boss damage bez podwajania XP.',unlocked:player.realLevel>=25,active:player.realLevel>=25,unlockReason:'REAL LV.25'},
  ];
}

export function bossDamageMultiplier(player:PlayerProfile,difficulty:QuestDifficulty,focusQuest=false){
  const perks=playerPerks(player);
  let multiplier=1;
  if(focusQuest&&perks.some(p=>p.id==='FOCUS_SURGE'&&p.active))multiplier+=.25;
  if(difficulty==='HARD'&&perks.some(p=>p.id==='BOSS_BREAKER'&&p.active))multiplier+=.35;
  return multiplier;
}
