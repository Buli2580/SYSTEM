/** SYSTEM Network rival/service. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_SERVICE_MODULE='rival.service' as const;
export type RivalServiceContext={actorId:string;now:string};
export function isRivalServiceContext(v:unknown):v is RivalServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
