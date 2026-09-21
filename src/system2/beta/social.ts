export type SocialHubModule='PROFILE'|'LEADERBOARD'|'FRIENDS'|'GUILDS'|'RAIDS'|'SHARE';
export const SOCIAL_HUB_MODULES:SocialHubModule[]=['PROFILE','LEADERBOARD','FRIENDS','GUILDS','RAIDS','SHARE'];
export function socialHubProgress(i:{profile:boolean;leaderboard:boolean;friends:boolean;guilds:boolean;raids:boolean;share:boolean}){return Object.values(i).filter(Boolean).length/6;}
