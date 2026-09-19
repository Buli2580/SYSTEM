/** SYSTEM Network challenge/types. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_TYPES_MODULE='challenge.types' as const;
export type ChallengeTypesContext={actorId:string;now:string};
export function isChallengeTypesContext(v:unknown):v is ChallengeTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
