/** SYSTEM Network feed/audit. Concrete extension seam; intentionally dependency-free. */
export const FEED_AUDIT_MODULE='feed.audit' as const;
export type FeedAuditContext={actorId:string;now:string};
export function isFeedAuditContext(v:unknown):v is FeedAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
