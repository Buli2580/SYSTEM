/** SYSTEM Network raid/state. Concrete extension seam; intentionally dependency-free. */
export const RAID_STATE_MODULE='raid.state' as const;
export type RaidStateContext={actorId:string;now:string};
export function isRaidStateContext(v:unknown):v is RaidStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
