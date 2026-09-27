import {riskScore,type VerificationSignal} from './antiCheat';

export type AntiCheat2Signal=
  |VerificationSignal
  |{kind:'MOCKED_LOCATION'|'TELEPORT'|'REPLAY'|'BACKGROUND_JUMP';severity:1|2|3};

const HARD_SIGNALS=new Set<AntiCheat2Signal['kind']>(['MOCKED_LOCATION','TELEPORT','REPLAY','CLOCK_SKEW']);

export function antiCheat2Risk(signals:AntiCheat2Signal[]){
 return Math.min(100,signals.reduce((sum,s)=>sum+s.severity*(HARD_SIGNALS.has(s.kind)?25:15),0));
}
export function antiCheat2Decision(signals:AntiCheat2Signal[]){
 const score=antiCheat2Risk(signals);
 return{score,action:score>=70?'REJECT':score>=40?'REVIEW':score>=20?'DOWNGRADE':'ACCEPT'} as const;
}
export function mergeLegacyRisk(signals:VerificationSignal[],extra:AntiCheat2Signal[]){
 return Math.max(riskScore(signals),antiCheat2Risk([...signals,...extra]));
}
