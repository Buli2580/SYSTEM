import type {SkillKey,PlayerProfile} from '../core/types';
export type SkillNode={id:string;skill:SkillKey;name:string;level:number;requires?:string;effect:string};
export const SKILL_TREE_2:readonly SkillNode[]=[
 {id:'str-iron',skill:'STR',name:'IRON CORE',level:5,effect:'Odblokowuje kosmetyczny znacznik siły.'},
 {id:'vit-engine',skill:'VIT',name:'ENDURANCE ENGINE',level:5,effect:'Eksponuje serię ruchową na karcie.'},
 {id:'int-oracle',skill:'INT',name:'ORACLE MIND',level:5,effect:'Wzmacnia prezentację questów nauki.'},
 {id:'wil-unbroken',skill:'WIL',name:'UNBROKEN WILL',level:5,effect:'Pokazuje recovery mastery.'},
 {id:'cha-signal',skill:'CHA',name:'SIGNAL VOICE',level:5,effect:'Odblokowuje social badge.'},
 {id:'cre-forge',skill:'CRE',name:'CREATOR FORGE',level:5,effect:'Odblokowuje creator aura.'},
 {id:'res-anchor',skill:'RES',name:'SYSTEM ANCHOR',level:5,effect:'Odblokowuje resilience frame.'},
];
export function skillTreeState(player:PlayerProfile){return SKILL_TREE_2.map(node=>({node,unlocked:(player.stats[node.skill]?.level??1)>=node.level,level:player.stats[node.skill]?.level??1}));}