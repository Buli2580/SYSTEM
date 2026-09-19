export const OFFLINE_ACCEPT_USE_CASE='offline.accept' as const;
export type OfflineAcceptInput={actorId:string;targetId?:string};
export type OfflineAcceptResult={ok:true}|{ok:false;code:string};
export function validateOfflineAccept(input:OfflineAcceptInput):OfflineAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
