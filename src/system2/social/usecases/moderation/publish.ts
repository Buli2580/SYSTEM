export const MODERATION_PUBLISH_USE_CASE='moderation.publish' as const;
export type ModerationPublishInput={actorId:string;targetId?:string};
export type ModerationPublishResult={ok:true}|{ok:false;code:string};
export function validateModerationPublish(input:ModerationPublishInput):ModerationPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
