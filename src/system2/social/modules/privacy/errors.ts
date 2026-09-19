/** SYSTEM Network privacy/errors. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_ERRORS_MODULE='privacy.errors' as const;
export type PrivacyErrorsContext={actorId:string;now:string};
export function isPrivacyErrorsContext(v:unknown):v is PrivacyErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
