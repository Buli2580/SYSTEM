export const MODERATION_ACCEPT_USE_CASE='moderation.accept' as const;
export type ModerationAcceptInput={actorId:string;targetId?:string};
export type ModerationAcceptResult={ok:true}|{ok:false;code:string};
export function validateModerationAccept(input:ModerationAcceptInput):ModerationAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
