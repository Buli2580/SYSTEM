/** SYSTEM Network challenge/state. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_STATE_MODULE='challenge.state' as const;
export type ChallengeStateContext={actorId:string;now:string};
export function isChallengeStateContext(v:unknown):v is ChallengeStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
