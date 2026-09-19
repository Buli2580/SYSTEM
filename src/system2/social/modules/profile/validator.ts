/** SYSTEM Network profile/validator. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_VALIDATOR_MODULE='profile.validator' as const;
export type ProfileValidatorContext={actorId:string;now:string};
export function isProfileValidatorContext(v:unknown):v is ProfileValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
