/** SYSTEM Network rival/limits. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_LIMITS_MODULE='rival.limits' as const;
export type RivalLimitsContext={actorId:string;now:string};
export function isRivalLimitsContext(v:unknown):v is RivalLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
