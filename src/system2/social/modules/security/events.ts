/** SYSTEM Network security/events. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_EVENTS_MODULE='security.events' as const;
export type SecurityEventsContext={actorId:string;now:string};
export function isSecurityEventsContext(v:unknown):v is SecurityEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
