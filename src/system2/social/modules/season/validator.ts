/** SYSTEM Network season/validator. Concrete extension seam; intentionally dependency-free. */
export const SEASON_VALIDATOR_MODULE='season.validator' as const;
export type SeasonValidatorContext={actorId:string;now:string};
export function isSeasonValidatorContext(v:unknown):v is SeasonValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
