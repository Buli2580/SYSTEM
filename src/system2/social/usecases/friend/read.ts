export const FRIEND_READ_USE_CASE='friend.read' as const;
export type FriendReadInput={actorId:string;targetId?:string};
export type FriendReadResult={ok:true}|{ok:false;code:string};
export function validateFriendRead(input:FriendReadInput):FriendReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
