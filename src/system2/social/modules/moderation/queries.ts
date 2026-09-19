/** SYSTEM Network moderation/queries. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_QUERIES_MODULE='moderation.queries' as const;
export type ModerationQueriesContext={actorId:string;now:string};
export function isModerationQueriesContext(v:unknown):v is ModerationQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
