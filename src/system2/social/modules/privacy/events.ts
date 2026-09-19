/** SYSTEM Network privacy/events. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_EVENTS_MODULE='privacy.events' as const;
export type PrivacyEventsContext={actorId:string;now:string};
export function isPrivacyEventsContext(v:unknown):v is PrivacyEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
