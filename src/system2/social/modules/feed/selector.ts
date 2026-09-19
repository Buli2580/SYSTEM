/** SYSTEM Network feed/selector. Concrete extension seam; intentionally dependency-free. */
export const FEED_SELECTOR_MODULE='feed.selector' as const;
export type FeedSelectorContext={actorId:string;now:string};
export function isFeedSelectorContext(v:unknown):v is FeedSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
