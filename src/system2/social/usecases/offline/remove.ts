export const OFFLINE_REMOVE_USE_CASE='offline.remove' as const;
export type OfflineRemoveInput={actorId:string;targetId?:string};
export type OfflineRemoveResult={ok:true}|{ok:false;code:string};
export function validateOfflineRemove(input:OfflineRemoveInput):OfflineRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
