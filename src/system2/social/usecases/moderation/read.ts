export const MODERATION_READ_USE_CASE='moderation.read' as const;
export type ModerationReadInput={actorId:string;targetId?:string};
export type ModerationReadResult={ok:true}|{ok:false;code:string};
export function validateModerationRead(input:ModerationReadInput):ModerationReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
