import {Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
export default function SystemOnlineScreen(){const router=useRouter();return <SystemPage title="SYSTEM ONLINE" subtitle="NETWORK // GLOBAL LAYER">
<View style={s.panel}><Text style={s.label}>TWOJA SIEĆ</Text><Text style={s.title}>SYSTEM ŁĄCZY GRACZY</Text><Text style={s.body}>Profil, rankingi, znajomi i odkrywanie graczy w jednym miejscu.</Text><Action label="MÓJ PROFIL →" onPress={()=>router.push('/social-profile')}/><Action label="ZNAJOMI →" onPress={()=>router.push('/friends')}/><Action label="RANKINGI →" onPress={()=>router.push('/leaderboard')}/><Action label="SZUKAJ GRACZY →" onPress={()=>router.push('/player-search')}/></View>
<View style={s.panel}><Text style={s.label}>GLOBAL GAMEPLAY</Text><Text style={s.body}>Fundament pod feed aktywności, gildie, wyzwania społecznościowe, raidy i sezony jest rozdzielony na niezależne moduły cloud/domain.</Text></View>
<View style={s.panel}><Text style={s.label}>PRYWATNOŚĆ</Text><Text style={s.body}>Domyślnie profil prywatny, aktywność dla znajomych, bez publicznego miasta i obecności. E-mail, tokeny i dokładne dane lokalizacji nie należą do publicznej warstwy SYSTEMU.</Text><Action label="KONTO I CHMURA →" onPress={()=>router.push('/account')}/></View>
</SystemPage>;}
