export const OFFLINE_REJECT_USE_CASE='offline.reject' as const;
export type OfflineRejectInput={actorId:string;targetId?:string};
export type OfflineRejectResult={ok:true}|{ok:false;code:string};
export function validateOfflineReject(input:OfflineRejectInput):OfflineRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
