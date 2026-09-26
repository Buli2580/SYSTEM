export type SocialMode='GUILD'|'PVP'|'RAID';
export type SocialSession={id:string;mode:SocialMode;state:'LOBBY'|'READY'|'ACTIVE'|'COMPLETE';members:number;required:number;startVerifiedQuestCount:number;verifiedProgress:number;target:number;outcome:'PENDING'|'SUCCESS'};
export function createSocialSession(mode:SocialMode,id:string):SocialSession{
 const required=mode==='RAID'?4:mode==='PVP'?2:1;
 const target=mode==='RAID'?4:mode==='PVP'?1:2;
 return{id,mode,state:'LOBBY',members:1,required,startVerifiedQuestCount:0,verifiedProgress:0,target,outcome:'PENDING'};
}
export function joinSession(s:SocialSession):SocialSession{const members=Math.min(s.required,s.members+1);return{...s,members,state:members>=s.required?'READY':'LOBBY'}}
export function startSession(s:SocialSession,verifiedQuestCount=0):SocialSession{return s.state==='READY'?{...s,state:'ACTIVE',startVerifiedQuestCount:verifiedQuestCount,verifiedProgress:0,outcome:'PENDING'}:s}
export function syncSessionProgress(s:SocialSession,verifiedQuestCount:number):SocialSession{if(s.state!=='ACTIVE')return s;const verifiedProgress=Math.max(0,verifiedQuestCount-s.startVerifiedQuestCount);return{...s,verifiedProgress,outcome:verifiedProgress>=s.target?'SUCCESS':'PENDING'}}
export function completeSession(s:SocialSession):SocialSession{return s.state==='ACTIVE'&&s.outcome==='SUCCESS'?{...s,state:'COMPLETE'}:s}
