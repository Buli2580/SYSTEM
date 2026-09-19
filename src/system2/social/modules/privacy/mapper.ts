/** SYSTEM Network privacy/mapper. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_MAPPER_MODULE='privacy.mapper' as const;
export type PrivacyMapperContext={actorId:string;now:string};
export function isPrivacyMapperContext(v:unknown):v is PrivacyMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
