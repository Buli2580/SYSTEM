/** SYSTEM Network badge/events. Concrete extension seam; intentionally dependency-free. */
export const BADGE_EVENTS_MODULE='badge.events' as const;
export type BadgeEventsContext={actorId:string;now:string};
export function isBadgeEventsContext(v:unknown):v is BadgeEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
