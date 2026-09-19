/** SYSTEM Network security/repository. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_REPOSITORY_MODULE='security.repository' as const;
export type SecurityRepositoryContext={actorId:string;now:string};
export function isSecurityRepositoryContext(v:unknown):v is SecurityRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
