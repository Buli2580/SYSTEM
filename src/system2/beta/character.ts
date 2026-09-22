export type CharacterSection='IDENTITY'|'PROGRESSION'|'SKILLS'|'TITLES'|'ACHIEVEMENTS'|'HISTORY';
export const CHARACTER_SECTIONS:CharacterSection[]=['IDENTITY','PROGRESSION','SKILLS','TITLES','ACHIEVEMENTS','HISTORY'];
export function characterCompletion(i:{avatar:boolean;title:boolean;skills:boolean;achievement:boolean}){return [i.avatar,i.title,i.skills,i.achievement].filter(Boolean).length/4;}
