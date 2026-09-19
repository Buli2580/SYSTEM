/** SYSTEM Network moderation/events. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_EVENTS_MODULE='moderation.events' as const;
export type ModerationEventsContext={actorId:string;now:string};
export function isModerationEventsContext(v:unknown):v is ModerationEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
