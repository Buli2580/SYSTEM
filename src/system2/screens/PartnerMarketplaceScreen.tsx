import { Text, View } from 'react-native';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import { ArtThumbnail } from '../components/VisualArt';
import { MARKET_CATEGORIES } from '../visual/assets';

/** Local category directory. Real offers require a verified partner catalog. */
export default function PartnerMarketplaceScreen() {
  return <SystemPage title="PARTNER MARKETPLACE" subtitle="KATEGORIE OFERT">
    <View style={s.panel}>
      <Text style={s.title}>Oferty w przygotowaniu</Text>
      <Text style={s.body}>W tych kategoriach pojawią się oferty po uruchomieniu katalogu partnerów. Obecnie nie ma dostępnych ofert ani nagród do odbioru.</Text>
    </View>
    {MARKET_CATEGORIES.map(category => <View key={category.id} style={[s.panel,{flexDirection:'row',alignItems:'center',gap:16}]}>
      <ArtThumbnail source={category.art}/>
      <View style={{flex:1}}><Text style={[s.title,{marginTop:0}]}>{category.label}</Text><Text style={s.body}>Oferty w przygotowaniu</Text></View>
    </View>)}
  </SystemPage>;
}
