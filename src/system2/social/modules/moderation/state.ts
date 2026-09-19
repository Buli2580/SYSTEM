/** SYSTEM Network moderation/state. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_STATE_MODULE='moderation.state' as const;
export type ModerationStateContext={actorId:string;now:string};
export function isModerationStateContext(v:unknown):v is ModerationStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
