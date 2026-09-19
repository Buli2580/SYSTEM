/** SYSTEM Network raid/limits. Concrete extension seam; intentionally dependency-free. */
export const RAID_LIMITS_MODULE='raid.limits' as const;
export type RaidLimitsContext={actorId:string;now:string};
export function isRaidLimitsContext(v:unknown):v is RaidLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
