export const OFFLINE_UPDATE_USE_CASE='offline.update' as const;
export type OfflineUpdateInput={actorId:string;targetId?:string};
export type OfflineUpdateResult={ok:true}|{ok:false;code:string};
export function validateOfflineUpdate(input:OfflineUpdateInput):OfflineUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
