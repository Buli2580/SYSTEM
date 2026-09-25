import type {MovementSkillKey,MovementSkillProgress,MoveQuest} from './types';
export const MOVEMENT_SKILLS:MovementSkillKey[]=['SPEED','BALANCE','COORDINATION','JUMP','THROW','CATCH','ENDURANCE'];
export function movementXpNeeded(level:number){return Math.round(60+Math.max(1,level)*24+Math.pow(Math.max(1,level),1.45)*8)}
export function initialMovementSkills():Record<MovementSkillKey,MovementSkillProgress>{
 return Object.fromEntries(MOVEMENT_SKILLS.map(key=>[key,{key,level:1,xp:0,xpToNext:movementXpNeeded(1)}])) as Record<MovementSkillKey,MovementSkillProgress>;
}
export function moveQuestSkillXp(quest:MoveQuest){const base=Math.max(8,quest.minutes*2);return Object.fromEntries(quest.skills.map(k=>[k,Math.round(base/quest.skills.length)])) as Partial<Record<MovementSkillKey,number>>}
export function applyMovementXp(skill:MovementSkillProgress,amount:number){
 let level=skill.level,xp=skill.xp+Math.max(0,amount),need=movementXpNeeded(level);
 while(xp>=need){xp-=need;need=movementXpNeeded(++level)}
 return{...skill,level,xp,xpToNext:need};
}
