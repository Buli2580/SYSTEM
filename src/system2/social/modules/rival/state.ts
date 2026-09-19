/** SYSTEM Network rival/state. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_STATE_MODULE='rival.state' as const;
export type RivalStateContext={actorId:string;now:string};
export function isRivalStateContext(v:unknown):v is RivalStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
