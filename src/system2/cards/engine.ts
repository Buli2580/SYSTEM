import type { PlayerProfile } from '../core/types';

export type CardRarity='R'|'SR'|'SSR'|'UR'|'MYTHIC'|'SYSTEM_EXCLUSIVE';
export type CardStyle='DARK_FANTASY'|'HUNTER'|'RUNIC'|'SHADOW'|'BOSS_SLAYER';
export type CardReason='PROFILE'|'LEVEL_UP'|'RANK_UP'|'STREAK'|'BOSS'|'AWAKENING';

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
  reason:CardReason;
  shareCaption:string;
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
export function buildSystemCard(player:PlayerProfile,reason:CardReason='PROFILE'):SystemCardModel{
  const evolution=evolutionForLevel(player.realLevel);
  const rarity=rarityForLevel(player.realLevel);
  const titles=['ORIGIN','AWAKENED','HUNTER','VANGUARD','DOMINATOR','LEGEND','ASCENDED'];
  const title=titles[evolution]??'ASCENDED';
  const power=Math.max(1000,Math.round(player.totalRealXp*3+player.realLevel*125+player.verifiedQuestCount*75+player.streak*40));
  return{
    id:'card:'+player.id+':'+reason+':'+player.realLevel+':'+player.rank,
    title:player.displayName+' // '+title,
    subtitle:reason==='BOSS'?'BOSS SLAYER':reason==='STREAK'?player.streak+' DAY STREAK':reason.replace('_',' '),
    rarity,style:styleForPlayer(player,reason),power,level:player.realLevel,rank:player.rank,evolution,reason,
    shareCaption:'SYSTEM // '+player.displayName+' · LV.'+player.realLevel+' · RANK '+player.rank+' · '+rarity,
  };
}

export function cardGenerationPrompt(player:PlayerProfile,reason:CardReason='PROFILE'):string{
  const c=buildSystemCard(player,reason);
  return [
    'Create an original premium vertical dark-fantasy RPG collectible player card.',
    'Player display name: '+player.displayName+'.',
    'Level '+c.level+', rank '+c.rank+', rarity '+c.rarity+', evolution stage '+c.evolution+', power '+c.power+'.',
    'Visual style: '+c.style+'. Reason: '+c.reason+'.',
    'Use the player avatar face when available; preserve recognizable facial features while transforming the body and outfit into an original fantasy hunter-warrior.',
    'Cinematic MMORPG card: ornate frame, shadow magic, runes, ruined citadel, premium foil lighting. No copyrighted characters or logos.',
  ].join(' ');
}
