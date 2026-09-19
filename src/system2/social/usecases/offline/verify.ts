export const OFFLINE_VERIFY_USE_CASE='offline.verify' as const;
export type OfflineVerifyInput={actorId:string;targetId?:string};
export type OfflineVerifyResult={ok:true}|{ok:false;code:string};
export function validateOfflineVerify(input:OfflineVerifyInput):OfflineVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
