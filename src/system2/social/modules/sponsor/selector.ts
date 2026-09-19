/** SYSTEM Network sponsor/selector. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_SELECTOR_MODULE='sponsor.selector' as const;
export type SponsorSelectorContext={actorId:string;now:string};
export function isSponsorSelectorContext(v:unknown):v is SponsorSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
