/** SYSTEM Network reputation/types. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_TYPES_MODULE='reputation.types' as const;
export type ReputationTypesContext={actorId:string;now:string};
export function isReputationTypesContext(v:unknown):v is ReputationTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
