/** SYSTEM Network discovery/eligibility. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_ELIGIBILITY_MODULE='discovery.eligibility' as const;
export type DiscoveryEligibilityContext={actorId:string;now:string};
export function isDiscoveryEligibilityContext(v:unknown):v is DiscoveryEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
