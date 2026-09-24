import {useEffect,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import {useSystem} from '../state/SystemProvider';
import {unlockedInventory,INVENTORY_ITEMS} from '../inventory/catalog';
import {equipInventoryItem,loadEquippedInventory,type EquippedInventory} from '../inventory/storage';

export default function InventoryScreen(){
 const {player,awakeningCompleted,story}=useSystem();
 const[equipped,setEquipped]=useState<EquippedInventory>({});
 useEffect(()=>{void loadEquippedInventory().then(setEquipped)},[]);
 const unlocked=unlockedInventory(player.realLevel,!!story?.bossComplete,awakeningCompleted);
 async function equip(kind:Parameters<typeof equipInventoryItem>[0],id:string){setEquipped(await equipInventoryItem(kind,id))}
 return <SystemPage title="INVENTORY" subtitle="ITEMS // RELICS // COSMETICS">
  <View style={s.panel}><Text style={s.label}>COLLECTION // EQUIPPED {Object.keys(equipped).length}</Text><Text style={s.title}>{unlocked.length} / {INVENTORY_ITEMS.length}</Text><Text style={s.body}>Inventory nie daje XP ani przewagi. Wyposażone przedmioty zmieniają wyłącznie tożsamość i prezentację SYSTEMU.</Text></View>
  {INVENTORY_ITEMS.map(item=>{const open=unlocked.some(x=>x.id===item.id),active=equipped[item.kind]===item.id;return <View key={item.id} style={[s.panel,{opacity:open?1:.45}]}><Text style={s.label}>{item.rarity} // {item.kind}{active?' // EQUIPPED':''}</Text><Text style={s.title}>{open?item.name:'SEALED ITEM'}</Text><Text style={s.body}>{open?item.description:'Wymaganie nie zostało jeszcze spełnione.'}</Text><Text style={s.body}>SOURCE // {item.source}{item.levelRequired?' · LV.'+item.levelRequired:''}</Text>{open&&<Action label={active?'EQUIPPED ✓':'WYPOSAŻ'} disabled={active} onPress={()=>void equip(item.kind,item.id)}/>}</View>})}
 </SystemPage>;
}