export type FriendshipState='NONE'|'REQUEST_SENT'|'REQUEST_RECEIVED'|'FRIENDS'|'BLOCKED';
export function sendFriendRequest(state:FriendshipState,self=false):FriendshipState{if(self)throw new Error('SELF_FRIEND');if(state==='BLOCKED')throw new Error('BLOCKED');if(state==='REQUEST_RECEIVED')return'FRIENDS';if(state==='FRIENDS'||state==='REQUEST_SENT')return state;return'REQUEST_SENT';}
export function acceptFriendRequest(state:FriendshipState):FriendshipState{if(state!=='REQUEST_RECEIVED')throw new Error('NO_REQUEST');return'FRIENDS';}
export function rejectFriendRequest(state:FriendshipState):FriendshipState{if(state!=='REQUEST_RECEIVED')throw new Error('NO_REQUEST');return'NONE';}
export function cancelFriendRequest(state:FriendshipState):FriendshipState{return state==='REQUEST_SENT'?'NONE':state;}
export function removeFriend(state:FriendshipState):FriendshipState{return state==='FRIENDS'?'NONE':state;}
