export const PRIVACY_ACCEPT_USE_CASE='privacy.accept' as const;
export type PrivacyAcceptInput={actorId:string;targetId?:string};
export type PrivacyAcceptResult={ok:true}|{ok:false;code:string};
export function validatePrivacyAccept(input:PrivacyAcceptInput):PrivacyAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
