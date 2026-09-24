export type Habit={id:string;title:string;frequency:'DAILY'|'WEEKDAYS'|'WEEKLY';minutes:number;streak:number;lastCompletedDay?:string};
export type HabitCompletion={habitId:string;day:string};

function parseDay(day:string){
 const date=new Date(day+'T12:00:00Z');
 return Number.isFinite(date.getTime())?date:null;
}
export function habitWeekKey(day:string){
 const date=parseDay(day);
 if(!date)return day;
 const d=new Date(date);
 const weekday=(d.getUTCDay()+6)%7;
 d.setUTCDate(d.getUTCDate()-weekday);
 return d.toISOString().slice(0,10);
}
function daysBetween(a:string,b:string){
 const first=parseDay(a),second=parseDay(b);
 if(!first||!second)return Number.POSITIVE_INFINITY;
 return Math.round((second.getTime()-first.getTime())/86400000);
}
export function dueHabits(habits:Habit[],day:string,weekday:number){
 const week=habitWeekKey(day);
 return habits.filter(h=>{
   if(h.frequency==='DAILY')return h.lastCompletedDay!==day;
   if(h.frequency==='WEEKDAYS')return weekday>=1&&weekday<=5&&h.lastCompletedDay!==day;
   return !h.lastCompletedDay||habitWeekKey(h.lastCompletedDay)!==week;
 });
}
export function completeHabit(habit:Habit,day:string):Habit{
 if(habit.lastCompletedDay===day)return habit;
 let streak=1;
 if(habit.lastCompletedDay){
   if(habit.frequency==='WEEKLY'){
     const previous=parseDay(habitWeekKey(habit.lastCompletedDay)),current=parseDay(habitWeekKey(day));
     if(previous&&current&&Math.round((current.getTime()-previous.getTime())/86400000)===7)streak=habit.streak+1;
   }else{
     const gap=daysBetween(habit.lastCompletedDay,day);
     const continuity=habit.frequency==='WEEKDAYS'
       ? gap===1||((new Date(day+'T12:00:00Z').getUTCDay()===1)&&gap<=3)
       : gap===1;
     if(continuity)streak=habit.streak+1;
   }
 }
 return{...habit,streak,lastCompletedDay:day};
}
export const STARTER_HABITS:readonly Habit[]=[
 {id:'habit-water-plan',title:'Zaplanuj wodę na dzień',frequency:'DAILY',minutes:2,streak:0},
 {id:'habit-priority',title:'Zapisz priorytet dnia',frequency:'DAILY',minutes:3,streak:0},
 {id:'habit-reset',title:'10 minut porządku',frequency:'WEEKDAYS',minutes:10,streak:0},
];
