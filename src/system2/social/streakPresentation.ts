export function streakTier(days:number){return days>=100?'LEGEND':days>=30?'ELITE':days>=7?'ACTIVE':'STARTER';}
export function nextStreakMilestone(days:number){return [3,7,14,30,60,100,365].find(x=>x>days)??null;}
