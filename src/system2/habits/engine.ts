export type Habit={id:string;title:string;frequency:'DAILY'|'WEEKDAYS'|'WEEKLY';minutes:number;streak:number;lastCompletedDay?:string};
export type HabitCompletion={habitId:string;day:string};
export function dueHabits(habits:Habit[],day:string,weekday:number){return habits.filter(h=>h.frequency==='DAILY'||(h.frequency==='WEEKDAYS'&&weekday>=1&&weekday<=5)||(h.frequency==='WEEKLY'&&!h.lastCompletedDay?.startsWith(day.slice(0,7))));}
export function completeHabit(habit:Habit,day:string):Habit{if(habit.lastCompletedDay===day)return habit;return{...habit,streak:habit.streak+1,lastCompletedDay:day};}
export const STARTER_HABITS:readonly Habit[]=[
 {id:'habit-water-plan',title:'Zaplanuj wodę na dzień',frequency:'DAILY',minutes:2,streak:0},
 {id:'habit-priority',title:'Zapisz priorytet dnia',frequency:'DAILY',minutes:3,streak:0},
 {id:'habit-reset',title:'10 minut porządku',frequency:'WEEKDAYS',minutes:10,streak:0},
];