export const OFFLINE_CREATE_USE_CASE='offline.create' as const;
export type OfflineCreateInput={actorId:string;targetId?:string};
export type OfflineCreateResult={ok:true}|{ok:false;code:string};
export function validateOfflineCreate(input:OfflineCreateInput):OfflineCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
