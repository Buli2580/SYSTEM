/** SYSTEM Network reputation/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_LIFECYCLE_MODULE='reputation.lifecycle' as const;
export type ReputationLifecycleContext={actorId:string;now:string};
export function isReputationLifecycleContext(v:unknown):v is ReputationLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
