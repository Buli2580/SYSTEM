import type { PlayerProfile, SkillKey } from './types';

export type ItemRarity='COMMON'|'RARE'|'EPIC'|'LEGENDARY';
export type EquipmentSlot='WEAPON'|'ARMOR'|'RING'|'RELIC';
export type LootSource='DAILY'|'WEEKLY'|'QUEST'|'BOSS'|'RAID'|'WORLD'|'SOCIAL'|'GUILD'|'PVP'|'SYSTEM';
export type ItemStatKey='STR'|'END'|'AGI'|'INT'|'VIT'|'WIL';
export type ItemStats=Partial<Record<ItemStatKey,number>>;
export type InventoryItem={
 id:string; templateId:string; name:string; rarity:ItemRarity; slot:EquipmentSlot; source:LootSource;
 equipped:boolean; requiredLevel:number; stats:ItemStats; acquiredAt:string; rewardKey:string;
};
export type InventoryFilter={rarity?:ItemRarity;slot?:EquipmentSlot;sort?:'NEWEST'|'RARITY'|'LEVEL'|'POWER'|'NAME'};
export type ItemComparison={current:InventoryItem|null;candidate:InventoryItem;powerDelta:number;statDelta:ItemStats;canEquip:boolean};

const rarityOrder:ItemRarity[]=['COMMON','RARE','EPIC','LEGENDARY'];
const rarityMultiplier:Record<ItemRarity,number>={COMMON:1,RARE:1.45,EPIC:2.15,LEGENDARY:3.2};
const sourceBoost:Record<LootSource,number>={DAILY:0,WEEKLY:1,QUEST:0,BOSS:2,RAID:2,WORLD:1,SOCIAL:1,GUILD:1,PVP:1,SYSTEM:0};
const sourceFloor:Partial<Record<LootSource,ItemRarity>>={WEEKLY:'RARE',BOSS:'RARE',RAID:'RARE',WORLD:'RARE'};
const slots:EquipmentSlot[]=['WEAPON','ARMOR','RING','RELIC'];

function hash(v:string){let h=2166136261;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rarityIndex(r:ItemRarity){return rarityOrder.indexOf(r);}
function maxRarity(a:ItemRarity,b:ItemRarity){return rarityIndex(a)>=rarityIndex(b)?a:b;}
function statValue(seed:string,level:number,rarity:ItemRarity,offset:number){return Math.max(1,Math.round((1+level/8+(hash(seed+':'+offset)%4))*rarityMultiplier[rarity]));}
function template(slot:EquipmentSlot,source:LootSource){if(source==='RAID')return 'RAIDBOUND '+(slot==='WEAPON'?'EDGE':slot==='ARMOR'?'PLATE':slot==='RING'?'SEAL':'CORE');if(source==='BOSS')return 'ANOMALY '+(slot==='WEAPON'?'EDGE':slot==='ARMOR'?'WARD':slot==='RING'?'SIGNET':'CORE');if(source==='WORLD')return 'WORLD '+(slot==='RELIC'?'RELIC':'ARTIFACT');return slot==='RELIC'?'SYSTEM RELIC':slot==='RING'?'SIGNAL RING':slot==='ARMOR'?'WARD ARMOR':'AWAKENED EDGE';}

export function rollRarity(seed:string,level:number,source:LootSource):ItemRarity{
 const roll=hash(seed+':rarity')%1000;
 const legendary=Math.min(120,8+level*2+(source==='RAID'?55:source==='BOSS'?35:0));
 const epic=Math.min(300,55+level*4+(source==='RAID'?100:source==='BOSS'?70:source==='WEEKLY'?35:0));
 const rare=Math.min(700,220+level*6+(source==='WEEKLY'||source==='WORLD'?100:0));
 let rarity:ItemRarity=roll<legendary?'LEGENDARY':roll<legendary+epic?'EPIC':roll<legendary+epic+rare?'RARE':'COMMON';
 const floor=sourceFloor[source]; if(floor) rarity=maxRarity(rarity,floor); return rarity;
}
export function createLoot(input:{rewardKey:string;level:number;source:LootSource;instance?:number;path?:'DISCIPLINE'|'MOTION'|'FOCUS';now?:string}):InventoryItem{
 const instance=input.instance??0, seed=input.rewardKey+':'+instance+':'+input.source;
 const rarity=rollRarity(seed,input.level,input.source),slot=slots[hash(seed+':slot')%slots.length];
 const primary:ItemStatKey=slot==='WEAPON'?'STR':slot==='ARMOR'?'END':slot==='RING'?'AGI':'INT';
 const pathStat:ItemStatKey=input.path==='DISCIPLINE'?'WIL':input.path==='MOTION'?'VIT':input.path==='FOCUS'?'INT':hash(seed)%2?'VIT':'WIL';
 const stats:ItemStats={[primary]:statValue(seed,input.level,rarity,1)};stats[pathStat]=(stats[pathStat]??0)+statValue(seed,input.level,rarity,2);
 if(primary!==pathStat&&rarityIndex(rarity)>=2) stats[slot==='WEAPON'?'AGI':slot==='ARMOR'?'VIT':'STR']=statValue(seed,input.level,rarity,3);
 const templateId=(input.source+':'+slot).toLowerCase();
 return{id:'loot:'+hash(seed).toString(36)+':'+instance,templateId,name:template(slot,input.source),rarity,slot,source:input.source,equipped:false,requiredLevel:Math.max(1,Math.floor(input.level*.75)+sourceBoost[input.source]),stats,acquiredAt:input.now??new Date().toISOString(),rewardKey:input.rewardKey};
}
// Backwards-compatible quest helper. The reward key stays stable, while instance makes duplicate templates legal.
export function rewardItem(seed:string,level:number,boss=false,instance=0):InventoryItem{return createLoot({rewardKey:seed,level,source:boss?'BOSS':'QUEST',instance});}
export function itemPower(item:InventoryItem){return Object.values(item.stats??{}).reduce((sum,n)=>sum+(n??0),0)*(rarityMultiplier[item.rarity]??1);}
export function equipItem(items:InventoryItem[],id:string,playerLevel=Number.MAX_SAFE_INTEGER){const target=items.find(x=>x.id===id);if(!target)return items;if((target.requiredLevel??1)>playerLevel)throw new Error('Wymagany REAL LEVEL '+target.requiredLevel+'.');return items.map(x=>x.slot===target.slot?{...x,equipped:x.id===id}:x);}
export function unequipItem(items:InventoryItem[],id:string){return items.map(x=>x.id===id?{...x,equipped:false}:x);}
export function compareItem(items:InventoryItem[],id:string,playerLevel:number):ItemComparison|null{const candidate=items.find(x=>x.id===id);if(!candidate)return null;const current=items.find(x=>x.slot===candidate.slot&&x.equipped)??null;const keys:ItemStatKey[]=['STR','END','AGI','INT','VIT','WIL'];const statDelta=Object.fromEntries(keys.map(k=>[k,(candidate.stats?.[k]??0)-(current?.stats?.[k]??0)]).filter(([,v])=>v!==0)) as ItemStats;return{current,candidate,powerDelta:itemPower(candidate)-(current?itemPower(current):0),statDelta,canEquip:(candidate.requiredLevel??1)<=playerLevel};}
export function filterInventory(items:InventoryItem[],filter:InventoryFilter={}){const result=items.filter(x=>(!filter.rarity||x.rarity===filter.rarity)&&(!filter.slot||x.slot===filter.slot));return [...result].sort((a,b)=>filter.sort==='RARITY'?rarityIndex(b.rarity)-rarityIndex(a.rarity):filter.sort==='LEVEL'?(b.requiredLevel??1)-(a.requiredLevel??1):filter.sort==='POWER'?itemPower(b)-itemPower(a):filter.sort==='NAME'?a.name.localeCompare(b.name):(b.acquiredAt??'').localeCompare(a.acquiredAt??''));}
export function equipmentBonuses(items:InventoryItem[]):ItemStats{const total:ItemStats={};for(const item of items.filter(x=>x.equipped))for(const [key,value] of Object.entries(item.stats??{}) as [ItemStatKey,number][])total[key]=(total[key]??0)+value;return total;}
export function presentedCharacterStats(player:PlayerProfile,items:InventoryItem[]){const gear=equipmentBonuses(items);const base=(key:SkillKey)=>player.stats[key]?.level??0;return{STR:base('STR')+(gear.STR??0),END:base('RES')+(gear.END??0),AGI:base('RES')+(gear.AGI??0),INT:base('INT')+(gear.INT??0),VIT:base('VIT')+(gear.VIT??0),WIL:base('WIL')+(gear.WIL??0),gear};}
