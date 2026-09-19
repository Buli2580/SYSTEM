/** SYSTEM Network season/serializer. Concrete extension seam; intentionally dependency-free. */
export const SEASON_SERIALIZER_MODULE='season.serializer' as const;
export type SeasonSerializerContext={actorId:string;now:string};
export function isSeasonSerializerContext(v:unknown):v is SeasonSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
