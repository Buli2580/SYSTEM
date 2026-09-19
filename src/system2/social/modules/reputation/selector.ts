/** SYSTEM Network reputation/selector. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_SELECTOR_MODULE='reputation.selector' as const;
export type ReputationSelectorContext={actorId:string;now:string};
export function isReputationSelectorContext(v:unknown):v is ReputationSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
