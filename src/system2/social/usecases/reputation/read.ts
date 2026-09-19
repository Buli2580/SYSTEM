export const REPUTATION_READ_USE_CASE='reputation.read' as const;
export type ReputationReadInput={actorId:string;targetId?:string};
export type ReputationReadResult={ok:true}|{ok:false;code:string};
export function validateReputationRead(input:ReputationReadInput):ReputationReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
