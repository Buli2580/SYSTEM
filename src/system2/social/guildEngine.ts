export type GuildRole='owner'|'officer'|'member';
export interface GuildMember { userId:string; role:GuildRole; joinedAt:string; contributionXp:number; }
export interface RaidContribution { userId:string; damage:number; verified:boolean; occurredAt:string; }
export interface RaidState { id:string; bossHp:number; startsAt:string; endsAt:string; contributions:RaidContribution[]; }
export function raidDamage(raid:RaidState):number { return raid.contributions.filter(x=>x.verified).reduce((n,x)=>n+Math.max(0,x.damage),0); }
export function raidRemainingHp(raid:RaidState):number { return Math.max(0,raid.bossHp-raidDamage(raid)); }
export function raidCompleted(raid:RaidState):boolean { return raidRemainingHp(raid)===0; }
export function guildLeaderboard(members:GuildMember[]):GuildMember[] { return [...members].sort((a,b)=>b.contributionXp-a.contributionXp || a.joinedAt.localeCompare(b.joinedAt)); }
