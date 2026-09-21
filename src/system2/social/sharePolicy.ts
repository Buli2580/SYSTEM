export type SharePrivacy={includeLevel:boolean;includeRank:boolean;includeStreak:boolean};
export const DEFAULT_SHARE_PRIVACY:SharePrivacy={includeLevel:true,includeRank:true,includeStreak:true};
export function sanitizeShareStats(stats:{level?:number;rank?:string;streak?:number},p:SharePrivacy){return {level:p.includeLevel?stats.level:undefined,rank:p.includeRank?stats.rank:undefined,streak:p.includeStreak?stats.streak:undefined};}
