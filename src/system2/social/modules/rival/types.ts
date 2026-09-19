/** SYSTEM Network rival/types. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_TYPES_MODULE='rival.types' as const;
export type RivalTypesContext={actorId:string;now:string};
export function isRivalTypesContext(v:unknown):v is RivalTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
