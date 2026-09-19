/** SYSTEM Network referral/events. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_EVENTS_MODULE='referral.events' as const;
export type ReferralEventsContext={actorId:string;now:string};
export function isReferralEventsContext(v:unknown):v is ReferralEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
