/** SYSTEM Network badge/selector. Concrete extension seam; intentionally dependency-free. */
export const BADGE_SELECTOR_MODULE='badge.selector' as const;
export type BadgeSelectorContext={actorId:string;now:string};
export function isBadgeSelectorContext(v:unknown):v is BadgeSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
