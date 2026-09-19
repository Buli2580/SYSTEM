export const FRIEND_ARCHIVE_USE_CASE='friend.archive' as const;
export type FriendArchiveInput={actorId:string;targetId?:string};
export type FriendArchiveResult={ok:true}|{ok:false;code:string};
export function validateFriendArchive(input:FriendArchiveInput):FriendArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
