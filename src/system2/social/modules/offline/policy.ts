/** SYSTEM Network offline/policy. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_POLICY_MODULE='offline.policy' as const;
export type OfflinePolicyContext={actorId:string;now:string};
export function isOfflinePolicyContext(v:unknown):v is OfflinePolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
