/** SYSTEM Network moderation/reducer. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_REDUCER_MODULE='moderation.reducer' as const;
export type ModerationReducerContext={actorId:string;now:string};
export function isModerationReducerContext(v:unknown):v is ModerationReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
