export const PRIVACY_PUBLISH_USE_CASE='privacy.publish' as const;
export type PrivacyPublishInput={actorId:string;targetId?:string};
export type PrivacyPublishResult={ok:true}|{ok:false;code:string};
export function validatePrivacyPublish(input:PrivacyPublishInput):PrivacyPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
