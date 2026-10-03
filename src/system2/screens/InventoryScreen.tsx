import {ArtThumbnail} from '../components/VisualArt';
import {itemArt} from '../visual/assets';
import LivingGear from '../components/LivingGear';
import {useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import {useSystem} from '../state/SystemProvider';
import {unlockedInventory,INVENTORY_ITEMS} from '../inventory/catalog';
import {equipInventoryItem,loadEquippedInventory,type EquippedInventory} from '../inventory/storage';

export default function InventoryScreen(){
 const {player,awakeningCompleted,story}=useSystem();
 const[equipped,setEquipped]=useState<EquippedInventory>({});
 const lock=useRef(false);const[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 useEffect(()=>{let active=true;void loadEquippedInventory().then(value=>{if(active)setEquipped(value)}).catch(()=>{if(active)setError('Nie udało się odczytać kolekcji.');});return()=>{active=false;};},[]);
 const unlocked=unlockedInventory(player.realLevel,!!story?.bossComplete,awakeningCompleted);
 async function equip(kind:Parameters<typeof equipInventoryItem>[0],id:string){if(lock.current)return;lock.current=true;setBusy(true);setError(null);try{setEquipped(await equipInventoryItem(kind,id));}catch{setError('Nie udało się zapisać kolekcji.');}finally{lock.current=false;setBusy(false);}}
 return <SystemPage title="INVENTORY" subtitle="ITEMS // RELICS // COSMETICS">
  <LivingGear key={player.id}/>
  {error&&<Text accessibilityRole="alert" style={s.body}>{error}</Text>}
  <View style={s.panel}><Text style={s.label}>COSMETIC COLLECTION // EQUIPPED {Object.keys(equipped).length}</Text><Text style={s.title}>{unlocked.length} / {INVENTORY_ITEMS.length}</Text><Text style={s.body}>Ta kolekcja kosmetyczna zmienia wyłącznie tożsamość i prezentację SYSTEMU. Bonusy rzeczywistego lootu pokazuje Living Gear powyżej.</Text></View>
  {INVENTORY_ITEMS.map(item=>{const open=unlocked.some(x=>x.id===item.id),active=equipped[item.kind]===item.id;return <View key={item.id} style={[s.panel,{opacity:open?1:.45}]}>{open&&<ArtThumbnail source={itemArt(item)}/>}<Text style={s.label}>{item.rarity} // {item.kind}{active?' // EQUIPPED':''}</Text><Text style={s.title}>{open?item.name:'SEALED ITEM'}</Text><Text style={s.body}>{open?item.description:'Wymaganie nie zostało jeszcze spełnione.'}</Text><Text style={s.body}>SOURCE // {item.source}{item.levelRequired?' · LV.'+item.levelRequired:''}</Text>{open&&<Action label={active?'EQUIPPED ✓':'WYPOSAŻ'} disabled={active||busy} onPress={()=>void equip(item.kind,item.id)}/>}</View>})}
 </SystemPage>;
}
