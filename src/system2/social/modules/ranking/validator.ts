/** SYSTEM Network ranking/validator. Concrete extension seam; intentionally dependency-free. */
export const RANKING_VALIDATOR_MODULE='ranking.validator' as const;
export type RankingValidatorContext={actorId:string;now:string};
export function isRankingValidatorContext(v:unknown):v is RankingValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
