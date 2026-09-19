/** SYSTEM Network presence/eligibility. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_ELIGIBILITY_MODULE='presence.eligibility' as const;
export type PresenceEligibilityContext={actorId:string;now:string};
export function isPresenceEligibilityContext(v:unknown):v is PresenceEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
