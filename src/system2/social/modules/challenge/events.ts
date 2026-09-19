/** SYSTEM Network challenge/events. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_EVENTS_MODULE='challenge.events' as const;
export type ChallengeEventsContext={actorId:string;now:string};
export function isChallengeEventsContext(v:unknown):v is ChallengeEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
