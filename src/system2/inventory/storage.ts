import AsyncStorage from '@react-native-async-storage/async-storage';
import type {ItemKind} from './catalog';

const KEY='system.inventory.equipped.v1';
const OWNED_KEY='system.inventory.owned.v1';
export type EquippedInventory=Partial<Record<ItemKind,string>>;
export async function loadEquippedInventory():Promise<EquippedInventory>{
 try{const raw=await AsyncStorage.getItem(KEY);const parsed=raw?JSON.parse(raw):{};return parsed&&typeof parsed==='object'?parsed:{};}catch{return{};}
}
export async function equipInventoryItem(kind:ItemKind,id:string|null){
 const current=await loadEquippedInventory();
 const next={...current};
 if(id)next[kind]=id;else delete next[kind];
 await AsyncStorage.setItem(KEY,JSON.stringify(next));
 return next;
}

export async function loadOwnedInventory():Promise<string[]>{
 try{
  const raw=await AsyncStorage.getItem(OWNED_KEY),parsed=raw?JSON.parse(raw):[];
  return Array.isArray(parsed)?[...new Set(parsed.filter(x=>typeof x==='string'&&x.length<=120))].slice(0,200):[];
 }catch{return[];}
}
export async function grantInventoryItem(id:string){
 const safe=id.trim();if(!safe||safe.length>120)throw new Error('Nieprawidłowy item.');
 const current=await loadOwnedInventory();
 if(current.includes(safe))return current;
 const next=[...current,safe].slice(-200);
 await AsyncStorage.setItem(OWNED_KEY,JSON.stringify(next));
 return next;
}
