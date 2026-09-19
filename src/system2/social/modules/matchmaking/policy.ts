/** SYSTEM Network matchmaking/policy. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_POLICY_MODULE='matchmaking.policy' as const;
export type MatchmakingPolicyContext={actorId:string;now:string};
export function isMatchmakingPolicyContext(v:unknown):v is MatchmakingPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
