/** SYSTEM Network privacy/service. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_SERVICE_MODULE='privacy.service' as const;
export type PrivacyServiceContext={actorId:string;now:string};
export function isPrivacyServiceContext(v:unknown):v is PrivacyServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
