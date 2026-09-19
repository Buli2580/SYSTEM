/** SYSTEM Network security/types. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_TYPES_MODULE='security.types' as const;
export type SecurityTypesContext={actorId:string;now:string};
export function isSecurityTypesContext(v:unknown):v is SecurityTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
