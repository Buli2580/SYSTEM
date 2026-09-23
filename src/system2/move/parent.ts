import type {MoveState} from './state';
export type ParentMoveSummary={activeMinutesToday:number;streak:number;sevenDayAverage:number;completedToday:number;skillLevels:Record<string,number>;preciseLocationIncluded:false};
export function parentMoveSummary(state:MoveState):ParentMoveSummary{
 const rows=[...state.history,{dayKey:state.dayKey,minutes:state.activeMinutes,questIds:state.completedQuestIds}].slice(-7);
 const average=rows.length?Math.round(rows.reduce((n,r)=>n+r.minutes,0)/rows.length):0;
 return{activeMinutesToday:state.activeMinutes,streak:state.streak,sevenDayAverage:average,completedToday:state.completedQuestIds.length,
  skillLevels:Object.fromEntries(Object.values(state.skills).map(s=>[s.key,s.level])),preciseLocationIncluded:false};
}
