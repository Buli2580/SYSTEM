/** SYSTEM Network challenge/serializer. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_SERIALIZER_MODULE='challenge.serializer' as const;
export type ChallengeSerializerContext={actorId:string;now:string};
export function isChallengeSerializerContext(v:unknown):v is ChallengeSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
