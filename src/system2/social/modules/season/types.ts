/** SYSTEM Network season/types. Concrete extension seam; intentionally dependency-free. */
export const SEASON_TYPES_MODULE='season.types' as const;
export type SeasonTypesContext={actorId:string;now:string};
export function isSeasonTypesContext(v:unknown):v is SeasonTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
