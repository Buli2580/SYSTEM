export const FRIEND_JOIN_USE_CASE='friend.join' as const;
export type FriendJoinInput={actorId:string;targetId?:string};
export type FriendJoinResult={ok:true}|{ok:false;code:string};
export function validateFriendJoin(input:FriendJoinInput):FriendJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
