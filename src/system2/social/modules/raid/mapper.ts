/** SYSTEM Network raid/mapper. Concrete extension seam; intentionally dependency-free. */
export const RAID_MAPPER_MODULE='raid.mapper' as const;
export type RaidMapperContext={actorId:string;now:string};
export function isRaidMapperContext(v:unknown):v is RaidMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
