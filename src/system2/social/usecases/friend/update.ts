export const FRIEND_UPDATE_USE_CASE='friend.update' as const;
export type FriendUpdateInput={actorId:string;targetId?:string};
export type FriendUpdateResult={ok:true}|{ok:false;code:string};
export function validateFriendUpdate(input:FriendUpdateInput):FriendUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
