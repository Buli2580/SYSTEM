export const PRIVACY_JOIN_USE_CASE='privacy.join' as const;
export type PrivacyJoinInput={actorId:string;targetId?:string};
export type PrivacyJoinResult={ok:true}|{ok:false;code:string};
export function validatePrivacyJoin(input:PrivacyJoinInput):PrivacyJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
