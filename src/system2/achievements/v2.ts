import type {PlayerProfile} from '../core/types';
export type AchievementMastery={tier:'BRONZE'|'SILVER'|'GOLD'|'PLATINUM';score:number;nextScore:number};
export function achievementMastery(player:PlayerProfile,unlocked:number,total:number):AchievementMastery{
 const completion=total?unlocked/total:0;
 const score=Math.round(completion*700+Math.min(300,player.realLevel*3));
 if(score>=900)return{tier:'PLATINUM',score,nextScore:1000};
 if(score>=650)return{tier:'GOLD',score,nextScore:900};
 if(score>=350)return{tier:'SILVER',score,nextScore:650};
 return{tier:'BRONZE',score,nextScore:350};
}
export function achievementMomentum(unlocked:number,total:number,streak:number){
 const pct=total?Math.round(unlocked/total*100):0;
 return{percent:pct,signal:streak>=14?'UNBROKEN':streak>=7?'RISING':pct>=50?'ADVANCING':'AWAKENING'};
}