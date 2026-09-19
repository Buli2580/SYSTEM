/** SYSTEM Network feed/eligibility. Concrete extension seam; intentionally dependency-free. */
export const FEED_ELIGIBILITY_MODULE='feed.eligibility' as const;
export type FeedEligibilityContext={actorId:string;now:string};
export function isFeedEligibilityContext(v:unknown):v is FeedEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
