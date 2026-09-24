export type SchoolMission={id:string;title:string;minutes:number;classTarget:number;privacy:'AGGREGATE_ONLY';verification:'TEACHER_APPROVAL'|'AGGREGATE_STEPS'};
export const SCHOOL_MISSIONS_2:readonly SchoolMission[]=[
 {id:'school-active-20',title:'20 MIN ACTIVE CLASS',minutes:20,classTarget:20,privacy:'AGGREGATE_ONLY',verification:'TEACHER_APPROVAL'},
 {id:'school-move-45',title:'MOVE 45',minutes:45,classTarget:45,privacy:'AGGREGATE_ONLY',verification:'TEACHER_APPROVAL'},
];
export function schoolCompletion(m:SchoolMission,minutes:number){return Math.min(100,Math.round(minutes/m.classTarget*100));}