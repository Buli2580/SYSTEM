/** SYSTEM Network friends/repository. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_REPOSITORY_MODULE='friends.repository' as const;
export type FriendsRepositoryContext={actorId:string;now:string};
export function isFriendsRepositoryContext(v:unknown):v is FriendsRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
