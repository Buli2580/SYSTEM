export const GOAL_CATEGORIES = ['FITNESS','STRENGTH','DISCIPLINE','PRODUCTIVITY','LEARNING','SOCIAL','LIFESTYLE','GENERAL'] as const;
export type GoalCategory = typeof GOAL_CATEGORIES[number];
export const GOAL_LABELS: Record<GoalCategory,string> = {FITNESS:'Kondycja / zmiana nawyków',STRENGTH:'Siła',DISCIPLINE:'Dyscyplina',PRODUCTIVITY:'Produktywność',LEARNING:'Nauka',SOCIAL:'Pewność w kontaktach',LIFESTYLE:'Codzienne nawyki',GENERAL:'Własny cel'};
export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type PlayerGoal = {id:string;category:GoalCategory;title:string;description:string;priority:1|2|3;createdAt:string;status:GoalStatus;target?:string;targetDate?:string};
export type GoalInput = Pick<PlayerGoal,'category'|'title'|'description'|'priority'|'target'|'targetDate'>;
export function validateGoal(input:GoalInput):GoalInput {
 if(!GOAL_CATEGORIES.includes(input.category)||![1,2,3].includes(input.priority)) throw new Error('Wybierz kategorię i priorytet celu.');
 const title=input.title.trim(),description=input.description.trim(),target=input.target?.trim();
 if(title.length<2||title.length>80||description.length>400||(target?.length??0)>120) throw new Error('Cel: tytuł 2–80 znaków, opis do 400, rezultat do 120.');
 if(input.targetDate && (!/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate)||!Number.isFinite(Date.parse(input.targetDate))||new Date(input.targetDate).toISOString().slice(0,10)!==input.targetDate)) throw new Error('Termin powinien mieć format RRRR-MM-DD.');
 return {...input,title,description,target:target||undefined,targetDate:input.targetDate||undefined};
}
