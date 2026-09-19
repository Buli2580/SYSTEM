/** SYSTEM Network rival/mapper. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_MAPPER_MODULE='rival.mapper' as const;
export type RivalMapperContext={actorId:string;now:string};
export function isRivalMapperContext(v:unknown):v is RivalMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
