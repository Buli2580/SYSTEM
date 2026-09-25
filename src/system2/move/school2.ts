export type SchoolMission={
 id:string;questId:'move_walk_10'|'move_run_10'|'move_bike_20';
 title:string;minutes:number;classTarget:number;
 privacy:'AGGREGATE_ONLY';verification:'SERVER_VERIFIED_GPS';
};
export const SCHOOL_MISSIONS_2:readonly SchoolMission[]=[
 {id:'school-walk-10',questId:'move_walk_10',title:'CLASS WALK SIGNAL',minutes:10,classTarget:10,privacy:'AGGREGATE_ONLY',verification:'SERVER_VERIFIED_GPS'},
 {id:'school-run-10',questId:'move_run_10',title:'CLASS RUN SIGNAL',minutes:10,classTarget:10,privacy:'AGGREGATE_ONLY',verification:'SERVER_VERIFIED_GPS'},
 {id:'school-bike-20',questId:'move_bike_20',title:'CLASS BIKE PATROL',minutes:20,classTarget:20,privacy:'AGGREGATE_ONLY',verification:'SERVER_VERIFIED_GPS'},
];
export function schoolCompletion(m:SchoolMission,minutes:number){
 return Math.min(100,Math.round(minutes/m.classTarget*100));
}
