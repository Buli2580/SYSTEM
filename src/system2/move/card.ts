import type {MoveState} from './state';
export type MovementProgressCard={
 title:string;subtitle:string;streak:number;activeMinutes:number;bestSkill:string;bestSkillLevel:number;shareText:string;
};
export function buildMovementProgressCard(displayName:string,state:MoveState):MovementProgressCard{
 const best=Object.values(state.skills).sort((a,b)=>b.level-a.level||b.xp-a.xp)[0];
 return{
  title:`${displayName} // MOVE`,subtitle:`${state.dayKey} · ${state.activeMinutes}/60 MIN`,streak:state.streak,activeMinutes:state.activeMinutes,
  bestSkill:best?.key??'ENDURANCE',bestSkillLevel:best?.level??1,
  shareText:`SYSTEM MOVE // ${displayName} · ${state.activeMinutes}/60 MIN · ${state.streak} DAY STREAK · ${best?.key??'ENDURANCE'} LV.${best?.level??1}`,
 };
}
