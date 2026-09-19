/** SYSTEM Network offline/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_LIFECYCLE_MODULE='offline.lifecycle' as const;
export type OfflineLifecycleContext={actorId:string;now:string};
export function isOfflineLifecycleContext(v:unknown):v is OfflineLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
