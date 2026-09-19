export const PRIVACY_LEAVE_USE_CASE='privacy.leave' as const;
export type PrivacyLeaveInput={actorId:string;targetId?:string};
export type PrivacyLeaveResult={ok:true}|{ok:false;code:string};
export function validatePrivacyLeave(input:PrivacyLeaveInput):PrivacyLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
