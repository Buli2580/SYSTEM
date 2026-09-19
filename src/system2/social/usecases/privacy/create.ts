export const PRIVACY_CREATE_USE_CASE='privacy.create' as const;
export type PrivacyCreateInput={actorId:string;targetId?:string};
export type PrivacyCreateResult={ok:true}|{ok:false;code:string};
export function validatePrivacyCreate(input:PrivacyCreateInput):PrivacyCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
