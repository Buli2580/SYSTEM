/** SYSTEM Network feed/types. Concrete extension seam; intentionally dependency-free. */
export const FEED_TYPES_MODULE='feed.types' as const;
export type FeedTypesContext={actorId:string;now:string};
export function isFeedTypesContext(v:unknown):v is FeedTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
