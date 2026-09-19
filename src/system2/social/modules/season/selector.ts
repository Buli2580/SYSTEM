/** SYSTEM Network season/selector. Concrete extension seam; intentionally dependency-free. */
export const SEASON_SELECTOR_MODULE='season.selector' as const;
export type SeasonSelectorContext={actorId:string;now:string};
export function isSeasonSelectorContext(v:unknown):v is SeasonSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
