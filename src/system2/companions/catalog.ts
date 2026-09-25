import type {SkillKey} from '../core/types';
export type Companion={id:string;name:string;role:string;skill:SkillKey;unlockLevel:number;description:string};
export const COMPANIONS:readonly Companion[]=[
 {id:'echo',name:'ECHO',role:'SCOUT AI',skill:'INT',unlockLevel:3,description:'Komentuje kierunek rozwoju i nowe sygnały.'},
 {id:'rook',name:'ROOK',role:'TRAINING UNIT',skill:'VIT',unlockLevel:8,description:'Towarzysz trybu ruchowego i serii.'},
 {id:'nyx',name:'NYX',role:'SHADOW GUIDE',skill:'WIL',unlockLevel:15,description:'Wspiera recovery i trudne serie.'},
 {id:'atlas',name:'ATLAS',role:'WORLD GUIDE',skill:'RES',unlockLevel:25,description:'Towarzysz eksploracji WORLD.'},
];
export function availableCompanions(level:number){return COMPANIONS.map(c=>({...c,unlocked:level>=c.unlockLevel}));}