/** SYSTEM Network sponsor/mapper. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_MAPPER_MODULE='sponsor.mapper' as const;
export type SponsorMapperContext={actorId:string;now:string};
export function isSponsorMapperContext(v:unknown):v is SponsorMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
