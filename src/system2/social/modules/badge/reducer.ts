/** SYSTEM Network badge/reducer. Concrete extension seam; intentionally dependency-free. */
export const BADGE_REDUCER_MODULE='badge.reducer' as const;
export type BadgeReducerContext={actorId:string;now:string};
export function isBadgeReducerContext(v:unknown):v is BadgeReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
