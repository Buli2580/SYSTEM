/** SYSTEM Network rival/selector. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_SELECTOR_MODULE='rival.selector' as const;
export type RivalSelectorContext={actorId:string;now:string};
export function isRivalSelectorContext(v:unknown):v is RivalSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
