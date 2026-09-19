/** SYSTEM Network sponsor/reducer. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_REDUCER_MODULE='sponsor.reducer' as const;
export type SponsorReducerContext={actorId:string;now:string};
export function isSponsorReducerContext(v:unknown):v is SponsorReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
