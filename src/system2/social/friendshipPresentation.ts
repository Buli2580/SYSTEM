export type FriendshipState='NONE'|'FOLLOWING'|'MUTUAL'|'FRIEND';
export function friendshipAction(s:FriendshipState){return s==='FRIEND'?'FRIENDS':s==='MUTUAL'?'CONNECT':s==='FOLLOWING'?'FOLLOWING':'FOLLOW';}
