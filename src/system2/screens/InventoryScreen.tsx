import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import {useSystem} from '../state/SystemProvider';
import {unlockedInventory,INVENTORY_ITEMS} from '../inventory/catalog';
export default function InventoryScreen(){const {player,awakeningCompleted,story}=useSystem();const unlocked=unlockedInventory(player.realLevel,!!story?.bossComplete,awakeningCompleted);return <SystemPage title="INVENTORY" subtitle="ITEMS // RELICS // COSMETICS">
 <View style={s.panel}><Text style={s.label}>COLLECTION</Text><Text style={s.title}>{unlocked.length} / {INVENTORY_ITEMS.length}</Text><Text style={s.body}>Inventory nie daje XP ani przewagi. Przedmioty są kosmetyczną historią postępu.</Text></View>
 {INVENTORY_ITEMS.map(item=>{const open=unlocked.some(x=>x.id===item.id);return <View key={item.id} style={[s.panel,{opacity:open?1:.45}]}><Text style={s.label}>{item.rarity} // {item.kind}</Text><Text style={s.title}>{open?item.name:'SEALED ITEM'}</Text><Text style={s.body}>{open?item.description:'Wymaganie nie zostało jeszcze spełnione.'}</Text><Text style={s.body}>SOURCE // {item.source}{item.levelRequired?' · LV.'+item.levelRequired:''}</Text></View>})}
 </SystemPage>}