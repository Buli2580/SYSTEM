/** SYSTEM Network season/state. Concrete extension seam; intentionally dependency-free. */
export const SEASON_STATE_MODULE='season.state' as const;
export type SeasonStateContext={actorId:string;now:string};
export function isSeasonStateContext(v:unknown):v is SeasonStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
