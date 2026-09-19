/** SYSTEM Network presence/service. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_SERVICE_MODULE='presence.service' as const;
export type PresenceServiceContext={actorId:string;now:string};
export function isPresenceServiceContext(v:unknown):v is PresenceServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
