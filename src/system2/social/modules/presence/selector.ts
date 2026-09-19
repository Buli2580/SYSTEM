/** SYSTEM Network presence/selector. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_SELECTOR_MODULE='presence.selector' as const;
export type PresenceSelectorContext={actorId:string;now:string};
export function isPresenceSelectorContext(v:unknown):v is PresenceSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
