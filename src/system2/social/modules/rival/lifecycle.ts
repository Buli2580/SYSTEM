/** SYSTEM Network rival/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_LIFECYCLE_MODULE='rival.lifecycle' as const;
export type RivalLifecycleContext={actorId:string;now:string};
export function isRivalLifecycleContext(v:unknown):v is RivalLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
