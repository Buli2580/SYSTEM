/** SYSTEM Network feed/policy. Concrete extension seam; intentionally dependency-free. */
export const FEED_POLICY_MODULE='feed.policy' as const;
export type FeedPolicyContext={actorId:string;now:string};
export function isFeedPolicyContext(v:unknown):v is FeedPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
