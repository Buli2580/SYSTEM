/** SYSTEM Network feed/validator. Concrete extension seam; intentionally dependency-free. */
export const FEED_VALIDATOR_MODULE='feed.validator' as const;
export type FeedValidatorContext={actorId:string;now:string};
export function isFeedValidatorContext(v:unknown):v is FeedValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
