import {useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import {useSystem} from '../state/SystemProvider';
import {compareItem,equipmentBonuses,filterInventory} from '../core/inventory';
import {pageStyles as s} from './SystemPage';
import Action from './Action';
import {ArtThumbnail} from './VisualArt';
import {itemArt} from '../visual/assets';

export default function LivingGear(){
 const {player,inventory,equipItem,unequipItem}=useSystem();
 const router=useRouter();const lock=useRef(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const [visible,setVisible]=useState(20);
 async function change(id:string,equipped:boolean){
  if(lock.current)return;lock.current=true;setBusy(true);setError(null);
  try{await(equipped?unequipItem(id):equipItem(id));}catch(e){setError(e instanceof Error?e.message:'Nie udało się zmienić wyposażenia.');}finally{lock.current=false;setBusy(false);}
 }
 const items=filterInventory(inventory,{sort:'NEWEST'});
 const bonuses=equipmentBonuses(inventory);
 return <View>
  <Text style={s.title}>LIVING GEAR</Text>
  <Text style={s.body}>ZAŁOŻONE: {inventory.filter(i=>i.equipped).map(i=>i.name).join(' · ')||'Brak'}</Text>
  <Text style={s.body}>BONUSY: {Object.entries(bonuses).map(([key,value])=>`${key} +${value}`).join(' · ')||'Brak'}</Text>
  <Text style={s.body}>Rozwój wyposażenia: zdobywaj nowe przedmioty i porównuj ich właściwości. Ewolucja instancji i Forge pozostają LOCKED.</Text>
  <Action label="TRACEBOOK → KRONIKA BOHATERA" onPress={()=>router.push('/tracebook')}/>
  {error&&<Text accessibilityRole="alert" style={s.body}>{error}</Text>}
  {!items.length&&<Text style={s.body}>Historia wyposażenia zacznie się od pierwszego zdobytego przedmiotu.</Text>}
  {items.slice(0,visible).map((item,index)=>{
   const comparison=compareItem(inventory,item.id,player.realLevel)!;
   return <View key={item.id} style={s.panel}>
    <ArtThumbnail source={itemArt(item)}/>
    <Text style={s.label}>{item.rarity} · {item.slot}{item.equipped?' · EQUIPPED':''}</Text>
    <Text style={s.title}>{item.name}</Text>
    {index===0&&<Text accessibilityLiveRegion="polite" style={s.label}>OSTATNIO ZDOBYTY</Text>}
    <Text style={s.body}>{Object.entries(item.stats).map(([k,v])=>`${k} +${v}`).join(' · ')} · WYMAGANY LV {item.requiredLevel}</Text>
    <Text style={s.body}>Źródło: {item.source} · {new Date(item.acquiredAt).toLocaleString()}</Text>
    <Text selectable style={s.label}>INSTANCJA: {item.id}</Text>
    {!item.equipped&&<Text style={s.body}>Względem {comparison.current?.name??'pustego slotu'}: {Object.entries(comparison.statDelta).map(([k,v])=>`${k} ${v!>0?'+':''}${v}`).join(' · ')||'bez zmiany'}</Text>}
    <Action label={item.equipped?'ZDEJMIJ':'WYPOSAŻ'} disabled={busy||(!item.equipped&&!comparison.canEquip)} onPress={()=>void change(item.id,item.equipped)}/>
   </View>;
  })}
  {items.length>visible&&<Action label="POKAŻ WIĘCEJ PRZEDMIOTÓW" onPress={()=>setVisible(n=>n+20)}/>}
 </View>;
}
