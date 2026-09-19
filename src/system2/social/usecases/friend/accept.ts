export const FRIEND_ACCEPT_USE_CASE='friend.accept' as const;
export type FriendAcceptInput={actorId:string;targetId?:string};
export type FriendAcceptResult={ok:true}|{ok:false;code:string};
export function validateFriendAccept(input:FriendAcceptInput):FriendAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
