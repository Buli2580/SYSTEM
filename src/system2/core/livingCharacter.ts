/** Read-only character identity derived from canonical progression and verified activity. */
import type {PlayerProfile,SkillKey} from '../core/types';
import {SKILL_KEYS,SKILL_META} from '../core/progression';
export type CharacterIdentity={
 level:number;rank:PlayerProfile['rank'];evolution:0|1|2;
 dominantSkill:SkillKey;dominantSkillName:string;
 verifiedQuests:number;distanceKm:number;
 milestones:readonly string[];nextMilestone:string;
};
const LEVEL_MILESTONES=[1,5,10,25,50,100] as const;
export function deriveCharacterIdentity(player:PlayerProfile):CharacterIdentity{
 if(!player||!Number.isSafeInteger(player.realLevel)||player.realLevel<1||
 !Number.isSafeInteger(player.verifiedQuestCount)||player.verifiedQuestCount<0||
 !Number.isFinite(player.totalDistanceMeters)||player.totalDistanceMeters<0||
 !SKILL_KEYS.every(key=>player.stats?.[key]&&Number.isSafeInteger(player.stats[key].totalXp)&&player.stats[key].totalXp>=0)){
  throw new Error('Invalid character progression');
 }
 const dominantSkill=SKILL_KEYS.reduce((best,key)=>
  player.stats[key].totalXp>player.stats[best].totalXp?key:best,SKILL_KEYS[0]);
 const milestones=LEVEL_MILESTONES.filter(level=>level<=player.realLevel).map(level=>`LEVEL_${level}`);
 const nextLevel=LEVEL_MILESTONES.find(level=>level>player.realLevel);
 return{
  level:player.realLevel,rank:player.rank,evolution:player.avatarEvolution,
  dominantSkill,dominantSkillName:SKILL_META[dominantSkill].name,
  verifiedQuests:player.verifiedQuestCount,
  distanceKm:Math.floor(player.totalDistanceMeters/100)/10,
  milestones,nextMilestone:nextLevel?`LEVEL_${nextLevel}`:'LEVEL_100_PLUS'
 };
}
