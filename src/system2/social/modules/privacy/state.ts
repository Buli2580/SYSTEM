/** SYSTEM Network privacy/state. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_STATE_MODULE='privacy.state' as const;
export type PrivacyStateContext={actorId:string;now:string};
export function isPrivacyStateContext(v:unknown):v is PrivacyStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
