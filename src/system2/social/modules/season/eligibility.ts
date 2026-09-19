/** SYSTEM Network season/eligibility. Concrete extension seam; intentionally dependency-free. */
export const SEASON_ELIGIBILITY_MODULE='season.eligibility' as const;
export type SeasonEligibilityContext={actorId:string;now:string};
export function isSeasonEligibilityContext(v:unknown):v is SeasonEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
