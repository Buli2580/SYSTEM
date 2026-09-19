import type {Relationship} from './types';
export function follow(current:Relationship,self=false):Relationship{if(self)throw new Error('SELF_FOLLOW');if(current==='BLOCKED')throw new Error('BLOCKED');if(current==='FOLLOWED_BY')return'MUTUAL';if(current==='MUTUAL'||current==='FOLLOWING')return current;return'FOLLOWING';}
export function unfollow(current:Relationship):Relationship{if(current==='MUTUAL')return'FOLLOWED_BY';if(current==='FOLLOWING')return'NONE';return current;}
export function block(self=false):Relationship{if(self)throw new Error('SELF_BLOCK');return'BLOCKED';}
export function unblock(current:Relationship):Relationship{return current==='BLOCKED'?'NONE':current;}
