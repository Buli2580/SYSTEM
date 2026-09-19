/** SYSTEM Network raid/selector. Concrete extension seam; intentionally dependency-free. */
export const RAID_SELECTOR_MODULE='raid.selector' as const;
export type RaidSelectorContext={actorId:string;now:string};
export function isRaidSelectorContext(v:unknown):v is RaidSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
