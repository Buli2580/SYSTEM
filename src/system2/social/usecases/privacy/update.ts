export const PRIVACY_UPDATE_USE_CASE='privacy.update' as const;
export type PrivacyUpdateInput={actorId:string;targetId?:string};
export type PrivacyUpdateResult={ok:true}|{ok:false;code:string};
export function validatePrivacyUpdate(input:PrivacyUpdateInput):PrivacyUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
