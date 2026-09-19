export const OFFLINE_LEAVE_USE_CASE='offline.leave' as const;
export type OfflineLeaveInput={actorId:string;targetId?:string};
export type OfflineLeaveResult={ok:true}|{ok:false;code:string};
export function validateOfflineLeave(input:OfflineLeaveInput):OfflineLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
