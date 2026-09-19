/** SYSTEM Network privacy/reducer. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_REDUCER_MODULE='privacy.reducer' as const;
export type PrivacyReducerContext={actorId:string;now:string};
export function isPrivacyReducerContext(v:unknown):v is PrivacyReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
