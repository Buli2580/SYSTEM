export type FamilyMission={id:string;title:string;minutes:number;participants:number;mode:'COOP'|'RELAY'|'TOGETHER';verification:'PARENT_APPROVAL'|'STEPS'|'GPS_SUMMARY'};
export function familyMissionScore(m:FamilyMission,completedParticipants:number){return Math.round(Math.min(1,completedParticipants/Math.max(1,m.participants))*100);}
export const FAMILY_MISSIONS_2:readonly FamilyMission[]=[
 {id:'family-walk-20',title:'FAMILY WALK',minutes:20,participants:2,mode:'TOGETHER',verification:'PARENT_APPROVAL'},
 {id:'family-relay-30',title:'MOVE RELAY',minutes:30,participants:3,mode:'RELAY',verification:'PARENT_APPROVAL'},
];