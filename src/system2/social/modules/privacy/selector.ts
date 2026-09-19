/** SYSTEM Network privacy/selector. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_SELECTOR_MODULE='privacy.selector' as const;
export type PrivacySelectorContext={actorId:string;now:string};
export function isPrivacySelectorContext(v:unknown):v is PrivacySelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
