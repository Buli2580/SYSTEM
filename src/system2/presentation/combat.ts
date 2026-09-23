import type { BossPhaseState } from '../story/bossEngine';

export type CombatBeatKind='CAMERA_PUSH'|'IMPACT'|'DAMAGE_NUMBER'|'HP_TRANSITION'|'BOSS_REACTION'|'PHASE_CHANGE'|'FINISHER'|'RETURN_HOME';
export type CombatBeat={kind:CombatBeatKind;at:number;duration:number;label?:string;value?:number};

export function combatSequence(before:BossPhaseState,after:BossPhaseState,damage:number):CombatBeat[]{
  const beats:CombatBeat[]=[
    {kind:'CAMERA_PUSH',at:0,duration:420,label:before.label},
    {kind:'IMPACT',at:360,duration:260},
    {kind:'DAMAGE_NUMBER',at:430,duration:700,label:`-${Math.max(0,damage)} HP`,value:damage},
    {kind:'HP_TRANSITION',at:470,duration:900,label:`${before.hp} → ${after.hp}`},
    {kind:'BOSS_REACTION',at:650,duration:700,label:after.label},
  ];
  if(before.phase!==after.phase)beats.push({kind:'PHASE_CHANGE',at:1180,duration:900,label:after.label});
  if(after.phase==='DEFEATED'||after.finisherReady)beats.push({kind:'FINISHER',at:1900,duration:1200,label:after.phase==='DEFEATED'?'BOSS DEFEATED':'FINAL STRIKE READY'});
  beats.push({kind:'RETURN_HOME',at:after.phase==='DEFEATED'?3300:2500,duration:400});
  return beats;
}
