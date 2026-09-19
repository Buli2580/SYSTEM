export const FRIEND_REJECT_USE_CASE='friend.reject' as const;
export type FriendRejectInput={actorId:string;targetId?:string};
export type FriendRejectResult={ok:true}|{ok:false;code:string};
export function validateFriendReject(input:FriendRejectInput):FriendRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
