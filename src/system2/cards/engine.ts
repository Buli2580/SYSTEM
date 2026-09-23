import type { PlayerProfile } from '../core/types';

export type CardRarity='R'|'SR'|'SSR'|'UR'|'MYTHIC'|'SYSTEM_EXCLUSIVE';
export type CardStyle='DARK_FANTASY'|'HUNTER'|'RUNIC'|'SHADOW'|'BOSS_SLAYER';
export type CardReason='PROFILE'|'LEVEL_UP'|'RANK_UP'|'STREAK'|'BOSS'|'AWAKENING';
export type CardEvolution='ORIGIN'|'AWAKENED'|'HUNTER'|'VANGUARD'|'DOMINATOR'|'LEGEND'|'ASCENDED';

export type SystemCardModel={
  id:string;
  title:string;
  subtitle:string;
  rarity:CardRarity;
  style:CardStyle;
  power:number;
  level:number;
  rank:string;
  evolution:number;
  evolutionName:CardEvolution;
  reason:CardReason;
  accent:string;
  frame:'IRON'|'RUNIC'|'VOID'|'ROYAL'|'MYTHIC'|'SYSTEM';
  shareCaption:string;
};

const EVOLUTIONS:CardEvolution[]=['ORIGIN','AWAKENED','HUNTER','VANGUARD','DOMINATOR','LEGEND','ASCENDED'];
const ACCENTS:Record<CardRarity,string>={
  R:'#7e99a5',SR:'#6ceeff',SSR:'#9d7cff',UR:'#ff9c5a',MYTHIC:'#ffd66c',SYSTEM_EXCLUSIVE:'#ffffff',
};

export function rarityForLevel(level:number):CardRarity{
  if(level>=100)return'SYSTEM_EXCLUSIVE';
  if(level>=75)return'MYTHIC';
  if(level>=50)return'UR';
  if(level>=25)return'SSR';
  if(level>=10)return'SR';
  return'R';
}
export function evolutionForLevel(level:number){return level>=100?6:level>=75?5:level>=50?4:level>=25?3:level>=10?2:level>=5?1:0}
export function styleForPlayer(player:PlayerProfile,reason:CardReason):CardStyle{
  if(reason==='BOSS')return'BOSS_SLAYER';
  if(player.rank==='SSS'||player.rank==='ASCENDED')return'SHADOW';
  const top=Object.entries(player.stats).sort((a,b)=>b[1].totalXp-a[1].totalXp)[0]?.[0];
  if(top==='INT'||top==='WIL')return'RUNIC';
  if(top==='STR'||top==='VIT')return'DARK_FANTASY';
  return'HUNTER';
}
function frameFor(rarity:CardRarity){
  if(rarity==='SYSTEM_EXCLUSIVE')return'SYSTEM' as const;
  if(rarity==='MYTHIC')return'MYTHIC' as const;
  if(rarity==='UR')return'ROYAL' as const;
  if(rarity==='SSR')return'VOID' as const;
  if(rarity==='SR')return'RUNIC' as const;
  return'IRON' as const;
}
export function buildSystemCard(player:PlayerProfile,reason:CardReason='PROFILE'):SystemCardModel{
  const evolution=evolutionForLevel(player.realLevel);
  const rarity=rarityForLevel(player.realLevel);
  const evolutionName=EVOLUTIONS[evolution]??'ASCENDED';
  const power=Math.max(1000,Math.round(player.totalRealXp*3+player.realLevel*125+player.verifiedQuestCount*75+player.streak*40));
  const special=reason==='BOSS'?'BOSS SLAYER':reason==='STREAK'?player.streak+' DAY STREAK':reason.replaceAll('_',' ');
  return{
    id:'card:'+player.id+':'+reason+':'+player.realLevel+':'+player.rank,
    title:player.displayName+' // '+evolutionName,
    subtitle:special,
    rarity,style:styleForPlayer(player,reason),power,level:player.realLevel,rank:player.rank,evolution,evolutionName,reason,
    accent:ACCENTS[rarity],frame:frameFor(rarity),
    shareCaption:'SYSTEM // '+player.displayName+' · LV.'+player.realLevel+' · RANK '+player.rank+' · '+rarity+' · '+evolutionName+' · POWER '+power.toLocaleString(),
  };
}

export function cardGenerationPrompt(player:PlayerProfile,reason:CardReason='PROFILE'):string{
  const c=buildSystemCard(player,reason);
  return [
    'Create an original premium vertical dark-fantasy RPG collectible player card.',
    'Player display name: '+player.displayName+'.',
    'Level '+c.level+', rank '+c.rank+', rarity '+c.rarity+', evolution '+c.evolutionName+', power '+c.power+'.',
    'Visual style: '+c.style+'. Frame tier: '+c.frame+'. Reason: '+c.reason+'.',
    'Use the player avatar face when available; preserve recognizable facial features while transforming body, armor and aura into an original fantasy hunter-warrior.',
    'Cinematic MMORPG card, layered ruined-world background, engraved runes, shadow energy, premium foil highlights, readable stats area, no copyrighted characters, logos or franchise-specific costumes.',
  ].join(' ');
}
