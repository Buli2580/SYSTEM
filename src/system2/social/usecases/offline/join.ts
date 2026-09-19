export const OFFLINE_JOIN_USE_CASE='offline.join' as const;
export type OfflineJoinInput={actorId:string;targetId?:string};
export type OfflineJoinResult={ok:true}|{ok:false;code:string};
export function validateOfflineJoin(input:OfflineJoinInput):OfflineJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
