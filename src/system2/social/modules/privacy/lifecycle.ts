/** SYSTEM Network privacy/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_LIFECYCLE_MODULE='privacy.lifecycle' as const;
export type PrivacyLifecycleContext={actorId:string;now:string};
export function isPrivacyLifecycleContext(v:unknown):v is PrivacyLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
