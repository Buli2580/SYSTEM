import {Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import {referralCode,REFERRAL_TIERS} from '../social/referrals2';
import {useSystem} from '../state/SystemProvider';
export default function BattleNetworkScreen(){const {player}=useSystem(),router=useRouter();return <SystemPage title="BATTLE NETWORK" subtitle="PVP // GUILD WARS // RAIDS // SEASONS">
 <View style={s.panel}><Text style={s.label}>PVP CHALLENGES</Text><Text style={s.title}>ASYNC VERIFIED DUELS</Text><Text style={s.body}>Porównujemy tylko zweryfikowane questy, MOVE minutes lub streak. Bez walki o REAL XP przeciwnika.</Text></View>
 <View style={s.panel}><Text style={s.label}>GUILD WARS</Text><Text style={s.title}>VERIFIED TEAM SCORE</Text><Text style={s.body}>Wynik gildii będzie liczony z kanonicznych zdarzeń, nie z ręcznego wpisywania punktów.</Text><Action label="GILDIE →" onPress={()=>router.push('/guilds')}/></View>
 <View style={s.panel}><Text style={s.label}>RAID 2.0 / SEASONS 2.0</Text><Action label="WORLD RAIDS →" onPress={()=>router.push('/raids')}/><Action label="SEASONS →" onPress={()=>router.push('/seasons')}/></View>
 <View style={s.panel}><Text style={s.label}>REFERRAL SYSTEM</Text><Text style={s.title}>{referralCode(player.id)}</Text><Text style={s.body}>Tiers: {REFERRAL_TIERS.map(x=>x.activated+'='+x.label).join(' · ')}</Text><Text style={s.body}>Referral nie przyznaje automatycznie REAL XP; nagrody mogą być kosmetyczne lub zewnętrzne.</Text></View>
 </SystemPage>}