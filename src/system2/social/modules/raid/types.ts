/** SYSTEM Network raid/types. Concrete extension seam; intentionally dependency-free. */
export const RAID_TYPES_MODULE='raid.types' as const;
export type RaidTypesContext={actorId:string;now:string};
export function isRaidTypesContext(v:unknown):v is RaidTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
