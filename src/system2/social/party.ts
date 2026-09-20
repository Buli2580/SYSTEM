export interface PartyMember { userId:string; ready:boolean; }
export interface Party { id:string; leaderId:string; members:PartyMember[]; maxMembers:number; }
export function canStartParty(party:Party):boolean { return party.members.length>0 && party.members.length<=party.maxMembers && party.members.some(x=>x.userId===party.leaderId) && party.members.every(x=>x.ready); }
export function canJoinParty(party:Party,userId:string):boolean { return party.members.length<party.maxMembers && !party.members.some(x=>x.userId===userId); }
