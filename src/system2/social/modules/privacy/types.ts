/** SYSTEM Network privacy/types. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_TYPES_MODULE='privacy.types' as const;
export type PrivacyTypesContext={actorId:string;now:string};
export function isPrivacyTypesContext(v:unknown):v is PrivacyTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
