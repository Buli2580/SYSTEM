/** SYSTEM Network raid/serializer. Concrete extension seam; intentionally dependency-free. */
export const RAID_SERIALIZER_MODULE='raid.serializer' as const;
export type RaidSerializerContext={actorId:string;now:string};
export function isRaidSerializerContext(v:unknown):v is RaidSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
