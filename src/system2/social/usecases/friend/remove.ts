export const FRIEND_REMOVE_USE_CASE='friend.remove' as const;
export type FriendRemoveInput={actorId:string;targetId?:string};
export type FriendRemoveResult={ok:true}|{ok:false;code:string};
export function validateFriendRemove(input:FriendRemoveInput):FriendRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
