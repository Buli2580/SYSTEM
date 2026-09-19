/** SYSTEM Network cache/policy. Concrete extension seam; intentionally dependency-free. */
export const CACHE_POLICY_MODULE='cache.policy' as const;
export type CachePolicyContext={actorId:string;now:string};
export function isCachePolicyContext(v:unknown):v is CachePolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
