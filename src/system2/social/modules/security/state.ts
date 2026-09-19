/** SYSTEM Network security/state. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_STATE_MODULE='security.state' as const;
export type SecurityStateContext={actorId:string;now:string};
export function isSecurityStateContext(v:unknown):v is SecurityStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
