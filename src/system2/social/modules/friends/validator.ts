/** SYSTEM Network friends/validator. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_VALIDATOR_MODULE='friends.validator' as const;
export type FriendsValidatorContext={actorId:string;now:string};
export function isFriendsValidatorContext(v:unknown):v is FriendsValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
