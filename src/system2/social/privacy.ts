import type {Relationship,SocialVisibility} from './types';
export function canViewProfile(v:SocialVisibility,r:Relationship){if(r==='BLOCKED')return false;return v==='PUBLIC'||(v==='FRIENDS'&&r==='MUTUAL');}
export function canViewActivity(v:SocialVisibility,r:Relationship){return canViewProfile(v,r);}
export function canFollowPlayer(r:Relationship){return r!=='BLOCKED';}
export function canSendFriendRequest(r:Relationship){return r==='NONE'||r==='FOLLOWING'||r==='FOLLOWED_BY';}
