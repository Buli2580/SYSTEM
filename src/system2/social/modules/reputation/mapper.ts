/** SYSTEM Network reputation/mapper. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_MAPPER_MODULE='reputation.mapper' as const;
export type ReputationMapperContext={actorId:string;now:string};
export function isReputationMapperContext(v:unknown):v is ReputationMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
