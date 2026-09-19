/** SYSTEM Network security/reducer. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_REDUCER_MODULE='security.reducer' as const;
export type SecurityReducerContext={actorId:string;now:string};
export function isSecurityReducerContext(v:unknown):v is SecurityReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
