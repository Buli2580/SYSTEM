/** SYSTEM Network security/selector. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_SELECTOR_MODULE='security.selector' as const;
export type SecuritySelectorContext={actorId:string;now:string};
export function isSecuritySelectorContext(v:unknown):v is SecuritySelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
