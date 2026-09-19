/** SYSTEM Network friends/events. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_EVENTS_MODULE='friends.events' as const;
export type FriendsEventsContext={actorId:string;now:string};
export function isFriendsEventsContext(v:unknown):v is FriendsEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
