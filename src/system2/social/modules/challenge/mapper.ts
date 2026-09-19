/** SYSTEM Network challenge/mapper. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_MAPPER_MODULE='challenge.mapper' as const;
export type ChallengeMapperContext={actorId:string;now:string};
export function isChallengeMapperContext(v:unknown):v is ChallengeMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
