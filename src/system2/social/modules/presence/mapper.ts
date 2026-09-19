/** SYSTEM Network presence/mapper. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_MAPPER_MODULE='presence.mapper' as const;
export type PresenceMapperContext={actorId:string;now:string};
export function isPresenceMapperContext(v:unknown):v is PresenceMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
