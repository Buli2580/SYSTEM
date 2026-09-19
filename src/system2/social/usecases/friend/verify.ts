export const FRIEND_VERIFY_USE_CASE='friend.verify' as const;
export type FriendVerifyInput={actorId:string;targetId?:string};
export type FriendVerifyResult={ok:true}|{ok:false;code:string};
export function validateFriendVerify(input:FriendVerifyInput):FriendVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
