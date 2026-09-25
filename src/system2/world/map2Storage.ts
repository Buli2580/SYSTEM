import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_WORLD_MAP_2,type WorldLayer,type WorldMap2State} from './map2';

const KEY='system.world.map2.v1';
const LAYERS:WorldLayer[]=['SECTORS','SIGNALS','EVENTS','BOSSES','MOVE'];

export async function loadWorldMap2State():Promise<WorldMap2State>{
 try{
  const raw=await AsyncStorage.getItem(KEY);
  if(!raw)return DEFAULT_WORLD_MAP_2;
  const value=JSON.parse(raw) as Partial<WorldMap2State>;
  const layers={...DEFAULT_WORLD_MAP_2.layers};
  if(value.layers&&typeof value.layers==='object'){
   for(const key of LAYERS)if(typeof value.layers[key]==='boolean')layers[key]=value.layers[key];
  }
  const zoomMode=['LOCAL','REGION','WORLD'].includes(String(value.zoomMode))?value.zoomMode as WorldMap2State['zoomMode']:DEFAULT_WORLD_MAP_2.zoomMode;
  const fog=typeof value.fog==='boolean'?value.fog:DEFAULT_WORLD_MAP_2.fog;
  return{layers,zoomMode,fog};
 }catch{return DEFAULT_WORLD_MAP_2;}
}
export async function saveWorldMap2State(state:WorldMap2State){
 const safe:WorldMap2State={
  layers:Object.fromEntries(LAYERS.map(k=>[k,Boolean(state.layers[k])])) as Record<WorldLayer,boolean>,
  zoomMode:['LOCAL','REGION','WORLD'].includes(state.zoomMode)?state.zoomMode:'LOCAL',
  fog:Boolean(state.fog),
 };
 await AsyncStorage.setItem(KEY,JSON.stringify(safe));
 return safe;
}
