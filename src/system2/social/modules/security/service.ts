/** SYSTEM Network security/service. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_SERVICE_MODULE='security.service' as const;
export type SecurityServiceContext={actorId:string;now:string};
export function isSecurityServiceContext(v:unknown):v is SecurityServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
