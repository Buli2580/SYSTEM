/** SYSTEM Network feed/events. Concrete extension seam; intentionally dependency-free. */
export const FEED_EVENTS_MODULE='feed.events' as const;
export type FeedEventsContext={actorId:string;now:string};
export function isFeedEventsContext(v:unknown):v is FeedEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
