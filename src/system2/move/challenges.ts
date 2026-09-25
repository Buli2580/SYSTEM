export type MoveChallengeAudience='FAMILY'|'SCHOOL'|'CITY'|'NATIONAL';
export type MoveChallenge={
 id:string;title:string;audience:MoveChallengeAudience;targetMinutes:number;
 startsAt:string;endsAt:string;sponsorName?:string;rewardLabel?:string;
};
export const MOVE_CHALLENGE_TEMPLATES:Omit<MoveChallenge,'startsAt'|'endsAt'>[]=[
 {id:'national_30d',title:'POLSKA RUSZA SIĘ // 30 DNI',audience:'NATIONAL',targetMinutes:10000000,rewardLabel:'NATIONAL WORLD BOSS'},
 {id:'school_week',title:'SCHOOL MOVE WEEK',audience:'SCHOOL',targetMinutes:6000,rewardLabel:'SCHOOL RAID CARD'},
 {id:'family_weekend',title:'FAMILY MOVE WEEKEND',audience:'FAMILY',targetMinutes:180,rewardLabel:'FAMILY RELIC'},
];
export function sponsorChallenge(id:string,title:string,targetMinutes:number,sponsorName:string):Omit<MoveChallenge,'startsAt'|'endsAt'>{
 return{id,title,audience:'CITY',targetMinutes:Math.max(1,targetMinutes),sponsorName,rewardLabel:'SPONSORED MOVE REWARD'};
}
