/** SYSTEM Network privacy/repository. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_REPOSITORY_MODULE='privacy.repository' as const;
export type PrivacyRepositoryContext={actorId:string;now:string};
export function isPrivacyRepositoryContext(v:unknown):v is PrivacyRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
