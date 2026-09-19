/** SYSTEM Network raid/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const RAID_LIFECYCLE_MODULE='raid.lifecycle' as const;
export type RaidLifecycleContext={actorId:string;now:string};
export function isRaidLifecycleContext(v:unknown):v is RaidLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
