/** SYSTEM Network sponsor/errors. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_ERRORS_MODULE='sponsor.errors' as const;
export type SponsorErrorsContext={actorId:string;now:string};
export function isSponsorErrorsContext(v:unknown):v is SponsorErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
