import AsyncStorage from '@react-native-async-storage/async-storage';
import type {ItemKind} from './catalog';

const KEY='system.inventory.equipped.v1';
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
