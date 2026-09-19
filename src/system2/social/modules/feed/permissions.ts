/** SYSTEM Network feed/permissions. Concrete extension seam; intentionally dependency-free. */
export const FEED_PERMISSIONS_MODULE='feed.permissions' as const;
export type FeedPermissionsContext={actorId:string;now:string};
export function isFeedPermissionsContext(v:unknown):v is FeedPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
