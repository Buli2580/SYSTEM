/** SYSTEM Network raid/eligibility. Concrete extension seam; intentionally dependency-free. */
export const RAID_ELIGIBILITY_MODULE='raid.eligibility' as const;
export type RaidEligibilityContext={actorId:string;now:string};
export function isRaidEligibilityContext(v:unknown):v is RaidEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
