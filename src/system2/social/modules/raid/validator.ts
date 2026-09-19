/** SYSTEM Network raid/validator. Concrete extension seam; intentionally dependency-free. */
export const RAID_VALIDATOR_MODULE='raid.validator' as const;
export type RaidValidatorContext={actorId:string;now:string};
export function isRaidValidatorContext(v:unknown):v is RaidValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
