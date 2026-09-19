/** SYSTEM Network security/queries. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_QUERIES_MODULE='security.queries' as const;
export type SecurityQueriesContext={actorId:string;now:string};
export function isSecurityQueriesContext(v:unknown):v is SecurityQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
