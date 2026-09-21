export type GuildPresence='QUIET'|'ACTIVE'|'SURGING';
export function guildPresence(activeMembers:number,totalMembers:number):GuildPresence{if(totalMembers<=0)return 'QUIET';const ratio=activeMembers/totalMembers;return ratio>=.6?'SURGING':ratio>=.2?'ACTIVE':'QUIET';}
