/** SYSTEM Network challenge/selector. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_SELECTOR_MODULE='challenge.selector' as const;
export type ChallengeSelectorContext={actorId:string;now:string};
export function isChallengeSelectorContext(v:unknown):v is ChallengeSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
