import AsyncStorage from '@react-native-async-storage/async-storage';
import {COMPANIONS} from './catalog';

const KEY='system.companion.active.v1';

export async function loadActiveCompanion():Promise<string|null>{
  try{
    const id=await AsyncStorage.getItem(KEY);
    return id&&COMPANIONS.some(c=>c.id===id)?id:null;
  }catch{return null;}
}
export async function saveActiveCompanion(id:string|null){
  if(id!==null&&!COMPANIONS.some(c=>c.id===id))throw new Error('Nieprawidłowy Companion.');
  if(id===null)await AsyncStorage.removeItem(KEY);else await AsyncStorage.setItem(KEY,id);
  return id;
}
