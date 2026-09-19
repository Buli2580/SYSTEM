/** SYSTEM Network security/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_LIFECYCLE_MODULE='security.lifecycle' as const;
export type SecurityLifecycleContext={actorId:string;now:string};
export function isSecurityLifecycleContext(v:unknown):v is SecurityLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
