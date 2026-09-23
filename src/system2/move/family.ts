export type FamilyMoveQuest={id:string;title:string;minutes:number;memberGoal:number;safeLocationRequired:boolean};
export const WEEKEND_FAMILY_QUESTS:FamilyMoveQuest[]=[
{id:'family_walk_45',title:'FAMILY EXPEDITION // WALK',minutes:45,memberGoal:2,safeLocationRequired:true},
{id:'family_bike_60',title:'FAMILY EXPEDITION // BIKE',minutes:60,memberGoal:2,safeLocationRequired:true},
{id:'family_outdoor_45',title:'FAMILY EXPEDITION // OUTDOOR',minutes:45,memberGoal:2,safeLocationRequired:true},
];
export function familyBossDamage(verifiedMinutes:number,members:number){if(verifiedMinutes<=0||members<2)return 0;return Math.max(0,Math.min(25,Math.floor(verifiedMinutes/10)+Math.max(0,members-1)*2))}
