export type Title2={id:string;name:string;rarity:'COMMON'|'RARE'|'EPIC'|'LEGENDARY';requirement:string;level?:number;streak?:number;boss?:boolean};
export const TITLE_CATALOG_2:readonly Title2[]=[
 {id:'awakened',name:'AWAKENED',rarity:'COMMON',requirement:'Ukończ Awakening'},
 {id:'night-runner',name:'NIGHT RUNNER',rarity:'RARE',requirement:'Osiągnij LV.5',level:5},
 {id:'unbroken',name:'UNBROKEN',rarity:'RARE',requirement:'7-day streak',streak:7},
 {id:'wallbreaker',name:'WALLBREAKER',rarity:'EPIC',requirement:'Pokonaj Bossa',boss:true},
 {id:'ash-king',name:'ASH KING',rarity:'EPIC',requirement:'Osiągnij LV.75',level:75},
 {id:'system-ascendant',name:'SYSTEM ASCENDANT',rarity:'LEGENDARY',requirement:'Osiągnij LV.100',level:100},
];
export function unlockedTitles2(level:number,streak:number,boss=false,awakening=false){return TITLE_CATALOG_2.filter(t=>(!t.level||level>=t.level)&&(!t.streak||streak>=t.streak)&&(!t.boss||boss)&&(t.id!=='awakened'||awakening));}