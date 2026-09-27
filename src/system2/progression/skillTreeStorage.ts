import AsyncStorage from '@react-native-async-storage/async-storage';
import {SKILL_TREE_2} from './skillTree2';
const KEY='system.skilltree.active.v1';
export type ActiveSkillNodes=Partial<Record<'STR'|'VIT'|'INT'|'WIL'|'CHA'|'CRE'|'RES',string>>;
export async function loadActiveSkillNodes():Promise<ActiveSkillNodes>{
 try{const raw=await AsyncStorage.getItem(KEY);const parsed=raw?JSON.parse(raw):{};return parsed&&typeof parsed==='object'?parsed:{};}catch{return{};}
}
export async function activateSkillNode(skill: keyof ActiveSkillNodes,nodeId:string,playerSkillLevel:number){
 const node=SKILL_TREE_2.find(n=>n.id===nodeId&&n.skill===skill);
 if(!node)throw new Error('Nieprawidłowy węzeł Skill Tree.');
 if(playerSkillLevel<node.level)throw new Error('Ten węzeł nie jest jeszcze odblokowany.');
 const current=await loadActiveSkillNodes(),next={...current,[skill]:nodeId};
 await AsyncStorage.setItem(KEY,JSON.stringify(next));
 return next;
}
