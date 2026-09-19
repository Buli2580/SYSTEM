/** SYSTEM Network profile/events. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_EVENTS_MODULE='profile.events' as const;
export type ProfileEventsContext={actorId:string;now:string};
export function isProfileEventsContext(v:unknown):v is ProfileEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
