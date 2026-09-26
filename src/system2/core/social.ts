export type SocialMode='GUILD'|'PVP'|'RAID';
export type SocialState='LOBBY'|'READY'|'ACTIVE'|'COMPLETE';
export type SocialAchievement='FIRST_PARTY'|'GUILD_LINK'|'PVP_WIN'|'RAID_CLEAR'|'RAID_VETERAN';
export type SocialReward={id:string;sessionId:string;mode:SocialMode;xp:number;lootSource:'GUILD'|'PVP'|'RAID';claimed:boolean};
export type SocialHistoryEntry={sessionId:string;mode:SocialMode;outcome:'SUCCESS';score:number;xp:number;completedAt:string};
export type RaidState={bossHp:number;bossMaxHp:number;phase:1|2|3;damageDealt:number};
export type SocialSession={id:string;mode:SocialMode;state:SocialState;members:number;required:number;startVerifiedQuestCount:number;verifiedProgress:number;target:number;outcome:'PENDING'|'SUCCESS';score:number;opponentScore:number;rematch:number;raid?:RaidState;reward?:SocialReward;completedAt?:string};

const config={GUILD:{required:2,target:3,xp:120},PVP:{required:2,target:2,xp:150},RAID:{required:4,target:6,xp:350}} as const;
export function createSocialSession(mode:SocialMode,id:string,rematch=0):SocialSession{const c=config[mode];return{id,mode,state:'LOBBY',members:1,required:c.required,startVerifiedQuestCount:0,verifiedProgress:0,target:c.target,outcome:'PENDING',score:0,opponentScore:mode==='PVP'?1:0,rematch,...(mode==='RAID'?{raid:{bossHp:1200,bossMaxHp:1200,phase:1,damageDealt:0}}:{})};}
export function joinSession(s:SocialSession):SocialSession{const members=Math.min(s.required,s.members+1);return{...s,members,state:members>=s.required?'READY':'LOBBY'};}
export function startSession(s:SocialSession,verifiedQuestCount=0):SocialSession{return s.state==='READY'?{...s,state:'ACTIVE',startVerifiedQuestCount:verifiedQuestCount,verifiedProgress:0,outcome:'PENDING'}:s;}
export function raidDamageForVerifiedQuest(verificationScore=100){return Math.max(60,Math.min(260,Math.round(80+verificationScore*1.4)));}
export function syncSessionProgress(s:SocialSession,verifiedQuestCount:number,verificationScore=100):SocialSession{
 if(s.state!=='ACTIVE')return s;const verifiedProgress=Math.max(0,verifiedQuestCount-s.startVerifiedQuestCount);
 if(s.mode==='RAID'){const gained=Math.max(0,verifiedProgress-s.verifiedProgress);const damage=gained*raidDamageForVerifiedQuest(verificationScore);const dealt=Math.min(s.raid!.bossMaxHp,s.raid!.damageDealt+damage),bossHp=Math.max(0,s.raid!.bossMaxHp-dealt);const ratio=bossHp/s.raid!.bossMaxHp;const phase:1|2|3=ratio>.66?1:ratio>.33?2:3;return{...s,verifiedProgress,score:dealt,raid:{...s.raid!,bossHp,damageDealt:dealt,phase},outcome:bossHp===0?'SUCCESS':'PENDING'};}
 const score=verifiedProgress;const success=s.mode==='PVP'?score>s.opponentScore:score>=s.target;return{...s,verifiedProgress,score,outcome:success?'SUCCESS':'PENDING'};
}
export function completeSession(s:SocialSession,now=new Date().toISOString()):SocialSession{if(s.state!=='ACTIVE'||s.outcome!=='SUCCESS')return s;const xp=config[s.mode].xp+Math.min(200,s.score*10);return{...s,state:'COMPLETE',completedAt:now,reward:{id:'social:'+s.id+':reward',sessionId:s.id,mode:s.mode,xp,lootSource:s.mode,claimed:false}};}
export function claimSocialReward(s:SocialSession):SocialSession{return s.reward&&!s.reward.claimed?{...s,reward:{...s.reward,claimed:true}}:s;}
export function rematchPvp(s:SocialSession,id:string):SocialSession{if(s.mode!=='PVP'||s.state!=='COMPLETE')throw new Error('Rematch wymaga ukończonego PvP.');return createSocialSession('PVP',id,s.rematch+1);}
export function resetSocialSession(s:SocialSession,id:string){return createSocialSession(s.mode,id,s.mode==='PVP'?s.rematch:0);}
export function historyEntry(s:SocialSession):SocialHistoryEntry|null{return s.state==='COMPLETE'&&s.completedAt&&s.reward?{sessionId:s.id,mode:s.mode,outcome:'SUCCESS',score:s.score,xp:s.reward.xp,completedAt:s.completedAt}:null;}
export function socialAchievements(history:SocialHistoryEntry[]):SocialAchievement[]{const out=new Set<SocialAchievement>();if(history.length)out.add('FIRST_PARTY');if(history.some(x=>x.mode==='GUILD'))out.add('GUILD_LINK');if(history.some(x=>x.mode==='PVP'))out.add('PVP_WIN');const raids=history.filter(x=>x.mode==='RAID').length;if(raids)out.add('RAID_CLEAR');if(raids>=5)out.add('RAID_VETERAN');return [...out];}
