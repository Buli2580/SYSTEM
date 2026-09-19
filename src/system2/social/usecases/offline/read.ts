export const OFFLINE_READ_USE_CASE='offline.read' as const;
export type OfflineReadInput={actorId:string;targetId?:string};
export type OfflineReadResult={ok:true}|{ok:false;code:string};
export function validateOfflineRead(input:OfflineReadInput):OfflineReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
