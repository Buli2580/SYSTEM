/** SYSTEM Network season/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const SEASON_LIFECYCLE_MODULE='season.lifecycle' as const;
export type SeasonLifecycleContext={actorId:string;now:string};
export function isSeasonLifecycleContext(v:unknown):v is SeasonLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
