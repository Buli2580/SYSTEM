/** SYSTEM Network privacy/queries. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_QUERIES_MODULE='privacy.queries' as const;
export type PrivacyQueriesContext={actorId:string;now:string};
export function isPrivacyQueriesContext(v:unknown):v is PrivacyQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
