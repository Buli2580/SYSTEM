/** SYSTEM Network season/service. Concrete extension seam; intentionally dependency-free. */
export const SEASON_SERVICE_MODULE='season.service' as const;
export type SeasonServiceContext={actorId:string;now:string};
export function isSeasonServiceContext(v:unknown):v is SeasonServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
