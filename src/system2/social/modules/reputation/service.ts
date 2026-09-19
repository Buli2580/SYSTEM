/** SYSTEM Network reputation/service. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_SERVICE_MODULE='reputation.service' as const;
export type ReputationServiceContext={actorId:string;now:string};
export function isReputationServiceContext(v:unknown):v is ReputationServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
