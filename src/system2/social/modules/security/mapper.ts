/** SYSTEM Network security/mapper. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_MAPPER_MODULE='security.mapper' as const;
export type SecurityMapperContext={actorId:string;now:string};
export function isSecurityMapperContext(v:unknown):v is SecurityMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
