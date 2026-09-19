/** SYSTEM Network sync/policy. Concrete extension seam; intentionally dependency-free. */
export const SYNC_POLICY_MODULE='sync.policy' as const;
export type SyncPolicyContext={actorId:string;now:string};
export function isSyncPolicyContext(v:unknown):v is SyncPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
