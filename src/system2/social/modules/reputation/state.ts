/** SYSTEM Network reputation/state. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_STATE_MODULE='reputation.state' as const;
export type ReputationStateContext={actorId:string;now:string};
export function isReputationStateContext(v:unknown):v is ReputationStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
