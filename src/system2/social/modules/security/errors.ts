/** SYSTEM Network security/errors. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_ERRORS_MODULE='security.errors' as const;
export type SecurityErrorsContext={actorId:string;now:string};
export function isSecurityErrorsContext(v:unknown):v is SecurityErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
