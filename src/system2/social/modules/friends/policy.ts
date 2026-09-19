/** SYSTEM Network friends/policy. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_POLICY_MODULE='friends.policy' as const;
export type FriendsPolicyContext={actorId:string;now:string};
export function isFriendsPolicyContext(v:unknown):v is FriendsPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
