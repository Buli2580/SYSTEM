export const FRIEND_LEAVE_USE_CASE='friend.leave' as const;
export type FriendLeaveInput={actorId:string;targetId?:string};
export type FriendLeaveResult={ok:true}|{ok:false;code:string};
export function validateFriendLeave(input:FriendLeaveInput):FriendLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
