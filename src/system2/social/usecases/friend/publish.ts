export const FRIEND_PUBLISH_USE_CASE='friend.publish' as const;
export type FriendPublishInput={actorId:string;targetId?:string};
export type FriendPublishResult={ok:true}|{ok:false;code:string};
export function validateFriendPublish(input:FriendPublishInput):FriendPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
