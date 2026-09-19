/** SYSTEM Network matchmaking/selector. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_SELECTOR_MODULE='matchmaking.selector' as const;
export type MatchmakingSelectorContext={actorId:string;now:string};
export function isMatchmakingSelectorContext(v:unknown):v is MatchmakingSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
