export type BossPhase='AWAKEN'|'ARMOR_BREAK'|'ENRAGE'|'FINAL_STRIKE'|'DEFEATED';
export type BossWeakPoint='FOCUS'|'MOVEMENT'|'DISCIPLINE'|'ANY';

export type BossPhaseState={
  phase:BossPhase;
  hp:number;
  maxHp:number;
  weakPoint:BossWeakPoint;
  damageMultiplier:number;
  enrage:boolean;
  finisherReady:boolean;
  label:string;
};

export function bossPhaseState(hp:number,maxHp=100,now=Date.now(),startedAt?:string):BossPhaseState{
  const safeMax=Math.max(1,maxHp),safeHp=Math.max(0,Math.min(safeMax,hp));
  const ratio=safeHp/safeMax;
  const elapsed=startedAt?Math.max(0,now-new Date(startedAt).getTime()):0;
  const enrageByTime=elapsed>=48*60*60*1000;
  if(safeHp<=0)return{phase:'DEFEATED',hp:0,maxHp:safeMax,weakPoint:'ANY',damageMultiplier:1,enrage:false,finisherReady:false,label:'BOSS DEFEATED'};
  if(ratio<=.15)return{phase:'FINAL_STRIKE',hp:safeHp,maxHp:safeMax,weakPoint:'ANY',damageMultiplier:1.15,enrage:true,finisherReady:true,label:'FINAL STRIKE'};
  if(ratio<=.4)return{phase:'ENRAGE',hp:safeHp,maxHp:safeMax,weakPoint:'DISCIPLINE',damageMultiplier:enrageByTime?.75:.9,enrage:true,finisherReady:false,label:'ENRAGE'};
  if(ratio<=.7)return{phase:'ARMOR_BREAK',hp:safeHp,maxHp:safeMax,weakPoint:'MOVEMENT',damageMultiplier:1.1,enrage:false,finisherReady:false,label:'ARMOR BREAK'};
  return{phase:'AWAKEN',hp:safeHp,maxHp:safeMax,weakPoint:'FOCUS',damageMultiplier:1,enrage:false,finisherReady:false,label:'AWAKEN'};
}

export function applyBossPhaseDamage(hp:number,rawDamage:number,maxHp=100,now=Date.now(),startedAt?:string){
  const before=bossPhaseState(hp,maxHp,now,startedAt);
  const dealt=Math.max(0,Math.round(rawDamage*before.damageMultiplier));
  const afterHp=Math.max(0,before.hp-dealt);
  const after=bossPhaseState(afterHp,maxHp,now,startedAt);
  return{before,after,rawDamage:Math.max(0,rawDamage),dealt,phaseChanged:before.phase!==after.phase};
}
