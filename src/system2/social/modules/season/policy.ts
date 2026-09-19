/** SYSTEM Network season/policy. Concrete extension seam; intentionally dependency-free. */
export const SEASON_POLICY_MODULE='season.policy' as const;
export type SeasonPolicyContext={actorId:string;now:string};
export function isSeasonPolicyContext(v:unknown):v is SeasonPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
