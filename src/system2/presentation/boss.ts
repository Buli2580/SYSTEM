export type BossPresentationPhase='INTRO'|'COMBAT'|'FINAL'|'DEFEATED';
export function bossPresentationPhase(hp:number,maxHp:number):BossPresentationPhase{if(hp<=0)return 'DEFEATED';return hp/Math.max(1,maxHp)<=.15?'FINAL':'COMBAT';}
export const BOSS_INTRO_DURATION_MS=3200;
