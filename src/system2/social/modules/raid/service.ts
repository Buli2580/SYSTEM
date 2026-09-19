/** SYSTEM Network raid/service. Concrete extension seam; intentionally dependency-free. */
export const RAID_SERVICE_MODULE='raid.service' as const;
export type RaidServiceContext={actorId:string;now:string};
export function isRaidServiceContext(v:unknown):v is RaidServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
