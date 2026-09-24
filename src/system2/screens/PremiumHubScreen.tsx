import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import {SHOP_OFFERS} from '../premium/shop2';
export default function PremiumHubScreen(){return <SystemPage title="PREMIUM / SHOP" subtitle="NO PAY-TO-WIN // SPONSORS">
 <View style={s.panel}><Text style={s.label}>ECONOMY RULE</Text><Text style={s.title}>ZERO PAY-TO-WIN</Text><Text style={s.body}>Zakup nie może przyznawać REAL XP, rangi, verified damage ani zaliczać questów. Monetyzujemy AI, statystyki i kosmetykę.</Text></View>
 {SHOP_OFFERS.map(o=><View key={o.id} style={s.panel}><Text style={s.label}>{o.kind} // {o.priceLabel}</Text><Text style={s.title}>{o.name}</Text><Text style={s.body}>{o.benefits.join(' · ')}</Text><Text style={s.body}>PAY TO WIN // NO</Text></View>)}
 <View style={s.panel}><Text style={s.label}>SPONSOR CHALLENGES 2.0</Text><Text style={s.body}>Sponsor może finansować wyzwanie i nagrodę zewnętrzną, ale wynik musi pochodzić ze zweryfikowanej aktywności. Sponsor nie ustawia XP.</Text></View>
 </SystemPage>}