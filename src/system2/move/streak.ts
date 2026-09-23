export const MOVE_STREAK_MILESTONES=[3,7,14,30,60,100] as const;
export function nextMoveStreakMilestone(streak:number){return MOVE_STREAK_MILESTONES.find(x=>x>streak)??null}
export function moveStreakReward(streak:number){
 if(streak>=100)return'MYTHIC MOVE CARD';
 if(streak>=60)return'SPECIAL MOVE INTRO';
 if(streak>=30)return'EVOLUTION EFFECT';
 if(streak>=14)return'MOVE PERK';
 if(streak>=7)return'MOVE CARD';
 if(streak>=3)return'MOVE AURA';
 return null;
}
