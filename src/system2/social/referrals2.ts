export type ReferralTier={activated:number;label:string};
export const REFERRAL_TIERS:readonly ReferralTier[]=[{activated:1,label:'SIGNAL I'},{activated:3,label:'SIGNAL III'},{activated:10,label:'NETWORK X'},{activated:25,label:'NODE XXV'}];
export function referralTier(activated:number){return [...REFERRAL_TIERS].reverse().find(x=>activated>=x.activated)??null;}
export function referralCode(playerId:string){return('SYS-'+playerId.replace(/[^a-z0-9]/gi,'').slice(-8)).toUpperCase();}