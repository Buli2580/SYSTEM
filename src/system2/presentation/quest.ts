export function questCompletionCopy(title:string,xp:number){return {eyebrow:'QUEST COMPLETE',title:title.trim()||'MISSION COMPLETE',detail:'+'+Math.max(0,xp).toLocaleString()+' REAL XP'};}
