export function rivalryGap(myXp:number,rivalXp:number){return rivalXp-myXp;}
export function rivalryMessage(myXp:number,rivalXp:number){const g=rivalryGap(myXp,rivalXp);return g===0?'REMIS':g>0?g.toLocaleString()+' XP DO RYWALA':Math.abs(g).toLocaleString()+' XP PRZEWAGI';}
