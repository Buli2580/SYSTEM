/** SYSTEM Network sponsor/limits. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_LIMITS_MODULE='sponsor.limits' as const;
export type SponsorLimitsContext={actorId:string;now:string};
export function isSponsorLimitsContext(v:unknown):v is SponsorLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
