export const FRIEND_CREATE_USE_CASE='friend.create' as const;
export type FriendCreateInput={actorId:string;targetId?:string};
export type FriendCreateResult={ok:true}|{ok:false;code:string};
export function validateFriendCreate(input:FriendCreateInput):FriendCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
