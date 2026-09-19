/** SYSTEM Network season/limits. Concrete extension seam; intentionally dependency-free. */
export const SEASON_LIMITS_MODULE='season.limits' as const;
export type SeasonLimitsContext={actorId:string;now:string};
export function isSeasonLimitsContext(v:unknown):v is SeasonLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
