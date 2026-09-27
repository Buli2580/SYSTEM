export type ItemRarity='COMMON'|'UNCOMMON'|'RARE'|'EPIC'|'LEGENDARY';
export type ItemKind='COSMETIC'|'BADGE'|'RELIC'|'FRAME'|'AURA';
export type InventoryItem={id:string;name:string;kind:ItemKind;rarity:ItemRarity;description:string;source:string;levelRequired?:number};
export const INVENTORY_ITEMS:readonly InventoryItem[]=[
 {id:'relic-origin-shard',name:'ORIGIN SHARD',kind:'RELIC',rarity:'COMMON',description:'Pamiątka pierwszego przebudzenia SYSTEMU.',source:'AWAKENING'},
 {id:'badge-first-wall',name:'WALLBREAKER SIGIL',kind:'BADGE',rarity:'RARE',description:'Odznaka za przełamanie pierwszego Bossa.',source:'BOSS'},
 {id:'frame-night-runner',name:'NIGHT RUNNER FRAME',kind:'FRAME',rarity:'UNCOMMON',description:'Profilowa ramka dla aktywnego gracza.',source:'LEVEL',levelRequired:5},
 {id:'aura-iron-titan',name:'IRON TITAN AURA',kind:'AURA',rarity:'RARE',description:'Kosmetyczna aura Hero Card.',source:'LEVEL',levelRequired:10},
 {id:'cosmetic-oracle-glyph',name:'ORACLE GLYPH',kind:'COSMETIC',rarity:'EPIC',description:'Symbol rozwoju INT / CRE.',source:'LEVEL',levelRequired:25},
 {id:'relic-ascendant-core',name:'ASCENDANT CORE',kind:'RELIC',rarity:'LEGENDARY',description:'Kosmetyczny relikt końcowej ewolucji.',source:'LEVEL',levelRequired:100},
];
export function unlockedInventory(level:number,bossComplete=false,awakening=false){
 return INVENTORY_ITEMS.filter(item=>(item.levelRequired??1)<=level&&(item.id!=='badge-first-wall'||bossComplete)&&(item.id!=='relic-origin-shard'||awakening));
}