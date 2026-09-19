/** SYSTEM Network sponsor/eligibility. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_ELIGIBILITY_MODULE='sponsor.eligibility' as const;
export type SponsorEligibilityContext={actorId:string;now:string};
export function isSponsorEligibilityContext(v:unknown):v is SponsorEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
