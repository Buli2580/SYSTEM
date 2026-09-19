/** SYSTEM Network season/mapper. Concrete extension seam; intentionally dependency-free. */
export const SEASON_MAPPER_MODULE='season.mapper' as const;
export type SeasonMapperContext={actorId:string;now:string};
export function isSeasonMapperContext(v:unknown):v is SeasonMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
