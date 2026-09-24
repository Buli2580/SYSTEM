export type FamilyMission={
 id:string;questId:'move_family_30'|'family_walk_45'|'family_bike_60'|'family_outdoor_45';
 title:string;minutes:number;participants:number;mode:'COOP'|'RELAY'|'TOGETHER';
 verification:'PARENT_APPROVAL';
};
export function familyMissionScore(m:FamilyMission,completedParticipants:number){
 return Math.round(Math.min(1,completedParticipants/Math.max(1,m.participants))*100);
}
export const FAMILY_MISSIONS_2:readonly FamilyMission[]=[
 {id:'family-expedition-30',questId:'move_family_30',title:'FAMILY EXPEDITION',minutes:30,participants:2,mode:'TOGETHER',verification:'PARENT_APPROVAL'},
 {id:'family-walk-45-v2',questId:'family_walk_45',title:'FAMILY WALK 45',minutes:45,participants:2,mode:'TOGETHER',verification:'PARENT_APPROVAL'},
 {id:'family-bike-60-v2',questId:'family_bike_60',title:'FAMILY BIKE 60',minutes:60,participants:2,mode:'COOP',verification:'PARENT_APPROVAL'},
 {id:'family-outdoor-45-v2',questId:'family_outdoor_45',title:'FAMILY OUTDOOR 45',minutes:45,participants:2,mode:'COOP',verification:'PARENT_APPROVAL'},
];
