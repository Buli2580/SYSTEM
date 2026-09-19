/** SYSTEM Network sponsor/state. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_STATE_MODULE='sponsor.state' as const;
export type SponsorStateContext={actorId:string;now:string};
export function isSponsorStateContext(v:unknown):v is SponsorStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
