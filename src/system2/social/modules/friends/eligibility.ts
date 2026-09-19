/** SYSTEM Network friends/eligibility. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_ELIGIBILITY_MODULE='friends.eligibility' as const;
export type FriendsEligibilityContext={actorId:string;now:string};
export function isFriendsEligibilityContext(v:unknown):v is FriendsEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
