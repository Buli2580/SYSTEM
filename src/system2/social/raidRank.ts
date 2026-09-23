export function raidContributionRank(position:number,total:number){return position>0&&total>0?`#${position} / ${total}`:'UNRANKED';}
export function contributionPercent(value:number,total:number){return total<=0?0:Math.max(0,Math.min(100,Math.round(value/total*100)));}
