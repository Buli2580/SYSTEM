export const RIVAL_READ_USE_CASE='rival.read' as const;
export type RivalReadInput={actorId:string;targetId?:string};
export type RivalReadResult={ok:true}|{ok:false;code:string};
export function validateRivalRead(input:RivalReadInput):RivalReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
