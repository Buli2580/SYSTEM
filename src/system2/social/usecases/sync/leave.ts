export const SYNC_LEAVE_USE_CASE='sync.leave' as const;
export type SyncLeaveInput={actorId:string;targetId?:string};
export type SyncLeaveResult={ok:true}|{ok:false;code:string};
export function validateSyncLeave(input:SyncLeaveInput):SyncLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
