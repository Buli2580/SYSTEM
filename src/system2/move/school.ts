export type SchoolRaidContribution={participantId:string;verifiedMinutes:number;dayKey:string};
export function schoolRaidDamage(rows:SchoolRaidContribution[]){return rows.reduce((n,r)=>n+Math.max(0,Math.floor(r.verifiedMinutes/5)),0)}
export function schoolContributionScore(verifiedMinutes:number,activeDays:number){return Math.round(Math.max(0,verifiedMinutes)+Math.max(0,activeDays)*10)}
export const SCHOOL_RANKING_RULE='REGULARITY_AND_CONTRIBUTION_ONLY' as const;
