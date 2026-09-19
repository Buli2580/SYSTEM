/** SYSTEM Network sponsor/service. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_SERVICE_MODULE='sponsor.service' as const;
export type SponsorServiceContext={actorId:string;now:string};
export function isSponsorServiceContext(v:unknown):v is SponsorServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
