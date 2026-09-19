/** SYSTEM Network feed/commands. Concrete extension seam; intentionally dependency-free. */
export const FEED_COMMANDS_MODULE='feed.commands' as const;
export type FeedCommandsContext={actorId:string;now:string};
export function isFeedCommandsContext(v:unknown):v is FeedCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
