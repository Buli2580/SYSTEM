export function xpGainLabel(xp:number){return '+'+Math.max(0,xp).toLocaleString()+' REAL XP';}
export function levelTransition(before:number,after:number){return after>before?`LV.${before} → LV.${after}`:null;}
