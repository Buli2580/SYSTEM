export const SYNC_READ_USE_CASE='sync.read' as const;
export type SyncReadInput={actorId:string;targetId?:string};
export type SyncReadResult={ok:true}|{ok:false;code:string};
export function validateSyncRead(input:SyncReadInput):SyncReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
