/** SYSTEM Network season/errors. Concrete extension seam; intentionally dependency-free. */
export const SEASON_ERRORS_MODULE='season.errors' as const;
export type SeasonErrorsContext={actorId:string;now:string};
export function isSeasonErrorsContext(v:unknown):v is SeasonErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
