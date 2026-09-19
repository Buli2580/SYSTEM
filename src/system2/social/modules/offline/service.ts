/** SYSTEM Network offline/service. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_SERVICE_MODULE='offline.service' as const;
export type OfflineServiceContext={actorId:string;now:string};
export function isOfflineServiceContext(v:unknown):v is OfflineServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
