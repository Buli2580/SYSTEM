/** Pure, offline recovery/consistency projection. Does not mutate canonical XP or streak. */
import {dayOrdinal} from '../daily/calendar';
import type {Outcome} from '../adaptive/engine';

export type RecoveryPhase='NEW'|'ACTIVE'|'GENTLE_RETURN'|'REBUILD';
export type RecoverySnapshot={
 phase:RecoveryPhase; activeDays7:number; activeDays30:number; missedDays:number|null;
 consistency7:number; consistency30:number; ember:number; suggestedQuestCount:number;
 message:string;
};
const DAY=/^\d{4}-\d{2}-\d{2}$/;
function ordinal(day:string):number|null{
 if(!DAY.test(day))return null;
 const [y,m,d]=day.split('-').map(Number);
 const time=Date.UTC(y,m-1,d);
 if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==day)return null;
 return dayOrdinal(day);
}
const active=(outcome:Outcome)=>outcome.outcome==='COMPLETE'||outcome.outcome==='RECOVERY';
/** Pass the user's local calendar date as YYYY-MM-DD; never derive local days from UTC here. */
export function recoverySnapshot(outcomes:readonly Outcome[],today:string):RecoverySnapshot{
 const todayIndex=ordinal(today);
 if(todayIndex===null)throw new Error('Invalid local calendar day');
 const days=new Set<number>();
 for(const event of outcomes){
  if(!active(event)||typeof event.at!=='string')continue;
  const timestamp=Date.parse(event.at);
  if(!Number.isFinite(timestamp))continue;
  // The caller owns timezone conversion. Date-only event keys are already local.
  const key=event.at.slice(0,10);
  const day=ordinal(key);
  if(day!==null&&day<=todayIndex&&day>=todayIndex-365)days.add(day);
 }
 const sorted=[...days].sort((a,b)=>b-a);
 const activeDays7=sorted.filter(day=>todayIndex-day<7).length;
 const activeDays30=sorted.filter(day=>todayIndex-day<30).length;
 const missedDays=sorted.length?Math.max(0,todayIndex-sorted[0]-1):null;
 const phase:RecoveryPhase=sorted.length===0?'NEW':missedDays!==null&&missedDays>=7?'GENTLE_RETURN':missedDays!==null&&missedDays>=2?'REBUILD':'ACTIVE';
 // Ember is a gentle engagement indicator, never XP or a penalty to existing progress.
 const ember=Math.min(100,Math.round(activeDays7/7*70+activeDays30/30*30));
 const suggestedQuestCount=phase==='GENTLE_RETURN'||phase==='NEW'?1:phase==='REBUILD'?2:3;
 const message=phase==='NEW'?'Zacznij od jednej małej misji.':
  phase==='GENTLE_RETURN'?'Witaj z powrotem. Jedna mała misja wystarczy.':
  phase==='REBUILD'?'Wracaj we własnym tempie. Nie musisz nadrabiać dni.':
  'Budujesz regularność. Każdy aktywny dzień się liczy.';
 return{phase,activeDays7,activeDays30,missedDays,consistency7:Math.round(activeDays7/7*100),consistency30:Math.round(activeDays30/30*100),ember,suggestedQuestCount,message};
}
