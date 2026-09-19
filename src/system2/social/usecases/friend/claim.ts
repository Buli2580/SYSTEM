export const FRIEND_CLAIM_USE_CASE='friend.claim' as const;
export type FriendClaimInput={actorId:string;targetId?:string};
export type FriendClaimResult={ok:true}|{ok:false;code:string};
export function validateFriendClaim(input:FriendClaimInput):FriendClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
