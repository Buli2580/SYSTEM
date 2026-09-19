/** SYSTEM Network presence/limits. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_LIMITS_MODULE='presence.limits' as const;
export type PresenceLimitsContext={actorId:string;now:string};
export function isPresenceLimitsContext(v:unknown):v is PresenceLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
