export function guildRankLabel(position:number){return position>0?'#'+position.toLocaleString():'UNRANKED';}
export function guildXpGap(current:number,next:number){return Math.max(0,next-current);}
