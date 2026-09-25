export type ItemRarity='COMMON'|'RARE'|'EPIC'|'LEGENDARY';
export type EquipmentSlot='WEAPON'|'ARMOR'|'RING'|'RELIC';
export type InventoryItem={id:string;name:string;rarity:ItemRarity;slot:EquipmentSlot;source:'QUEST'|'BOSS'|'WORLD'|'SYSTEM';equipped:boolean};
const rarityOrder:ItemRarity[]=['COMMON','RARE','EPIC','LEGENDARY'];
export function rewardItem(seed:string,level:number,boss=false):InventoryItem{
 const rarity=rarityOrder[Math.min(3,boss?Math.max(1,Math.floor(level/10)):Math.floor(level/15))];
 const slot:EquipmentSlot[]=['WEAPON','ARMOR','RING','RELIC'];
 const selected=slot[Math.abs(hash(seed))%slot.length];
 return {id:'reward:'+seed,name:boss?'ANOMALY CORE':selected==='RELIC'?'SYSTEM RELIC':selected==='RING'?'SIGNAL RING':selected==='ARMOR'?'WARD ARMOR':'AWAKENED EDGE',rarity,slot:selected,source:boss?'BOSS':'QUEST',equipped:false};
}
export function equipItem(items:InventoryItem[],id:string){const target=items.find(x=>x.id===id);if(!target)return items;return items.map(x=>x.slot===target.slot?{...x,equipped:x.id===id}:x)}
function hash(v:string){let h=0;for(let i=0;i<v.length;i++)h=((h<<5)-h)+v.charCodeAt(i)|0;return h}
