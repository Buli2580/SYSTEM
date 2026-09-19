/** SYSTEM Network sponsor/types. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_TYPES_MODULE='sponsor.types' as const;
export type SponsorTypesContext={actorId:string;now:string};
export function isSponsorTypesContext(v:unknown):v is SponsorTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
