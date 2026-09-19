export const PRIVACY_REMOVE_USE_CASE='privacy.remove' as const;
export type PrivacyRemoveInput={actorId:string;targetId?:string};
export type PrivacyRemoveResult={ok:true}|{ok:false;code:string};
export function validatePrivacyRemove(input:PrivacyRemoveInput):PrivacyRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
