/** SYSTEM Network raid/reducer. Concrete extension seam; intentionally dependency-free. */
export const RAID_REDUCER_MODULE='raid.reducer' as const;
export type RaidReducerContext={actorId:string;now:string};
export function isRaidReducerContext(v:unknown):v is RaidReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
