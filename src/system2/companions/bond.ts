import type {PlayerProfile} from '../core/types';
import type {Companion} from './catalog';

export type CompanionBond={
 level:1|2|3|4|5;
 score:number;
 nextScore:number;
 state:'NEW'|'SYNCED'|'TRUSTED'|'ELITE'|'ASCENDED';
};

export function companionBond(player:PlayerProfile,companion:Companion):CompanionBond{
 const skill=player.stats[companion.skill]?.level??1;
 const score=Math.max(0,Math.floor(
   player.verifiedQuestCount*4+
   player.streak*3+
   Math.max(0,skill-1)*12+
   Math.max(0,player.realLevel-companion.unlockLevel)*2
 ));
 if(score>=400)return{level:5,score,nextScore:400,state:'ASCENDED'};
 if(score>=220)return{level:4,score,nextScore:400,state:'ELITE'};
 if(score>=100)return{level:3,score,nextScore:220,state:'TRUSTED'};
 if(score>=35)return{level:2,score,nextScore:100,state:'SYNCED'};
 return{level:1,score,nextScore:35,state:'NEW'};
}
