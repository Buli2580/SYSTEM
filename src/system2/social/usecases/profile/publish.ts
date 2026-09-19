export const PROFILE_PUBLISH_USE_CASE='profile.publish' as const;
export type ProfilePublishInput={actorId:string;targetId?:string};
export type ProfilePublishResult={ok:true}|{ok:false;code:string};
export function validateProfilePublish(input:ProfilePublishInput):ProfilePublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
