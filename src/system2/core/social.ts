export type SocialMode='GUILD'|'PVP'|'RAID';
export type SocialSession={id:string;mode:SocialMode;state:'LOBBY'|'READY'|'ACTIVE'|'COMPLETE';members:number;required:number};
export function createSocialSession(mode:SocialMode,id:string):SocialSession{
 const required=mode==='RAID'?4:mode==='PVP'?2:1;
 return{id,mode,state:'LOBBY',members:1,required};
}
export function joinSession(s:SocialSession):SocialSession{const members=Math.min(s.required,s.members+1);return{...s,members,state:members>=s.required?'READY':'LOBBY'}}
export function startSession(s:SocialSession):SocialSession{return s.state==='READY'?{...s,state:'ACTIVE'}:s}
export function completeSession(s:SocialSession):SocialSession{return s.state==='ACTIVE'?{...s,state:'COMPLETE'}:s}
