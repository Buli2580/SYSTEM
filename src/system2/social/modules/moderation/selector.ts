/** SYSTEM Network moderation/selector. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_SELECTOR_MODULE='moderation.selector' as const;
export type ModerationSelectorContext={actorId:string;now:string};
export function isModerationSelectorContext(v:unknown):v is ModerationSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
