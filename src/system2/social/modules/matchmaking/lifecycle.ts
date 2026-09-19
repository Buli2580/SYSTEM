/** SYSTEM Network matchmaking/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_LIFECYCLE_MODULE='matchmaking.lifecycle' as const;
export type MatchmakingLifecycleContext={actorId:string;now:string};
export function isMatchmakingLifecycleContext(v:unknown):v is MatchmakingLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
