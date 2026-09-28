import {useRouter} from 'expo-router';
import {useEffect,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {SHOP_OFFERS} from '../premium/shop2';
import {getActiveSponsorChallenges2,joinSponsorChallenge2,type CloudSponsorChallenge2} from '../cloud/sponsors2';
import {getMyPremiumEntitlement,type CloudPremiumEntitlement} from '../cloud/premium';

export default function PremiumHubScreen(){
 const router=useRouter();
 const[rows,setRows]=useState<CloudSponsorChallenge2[]>([]),[entitlement,setEntitlement]=useState<CloudPremiumEntitlement|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 async function load(){setBusy(true);setError(null);try{const [sponsorRows,premium]=await Promise.all([getActiveSponsorChallenges2(),getMyPremiumEntitlement()]);setRows(sponsorRows);setEntitlement(premium)}catch(e){setError(e instanceof Error?e.message:'PREMIUM_NETWORK_FAILED')}finally{setBusy(false)}}
 async function join(id:string){setBusy(true);setError(null);try{await joinSponsorChallenge2(id);await load()}catch(e){setError(e instanceof Error?e.message:'SPONSOR_JOIN_FAILED');setBusy(false)}}
 useEffect(()=>{void load()},[]);
 return <SystemPage title="PREMIUM / SHOP" subtitle="NO PAY-TO-WIN // SPONSORS">
  <Action label="PARTNER MARKETPLACE →" onPress={()=>router.push('/partner-marketplace' as never)}/>
  <View style={s.panel}><Text style={s.label}>ECONOMY RULE</Text><Text style={s.title}>ZERO PAY-TO-WIN</Text><Text style={s.body}>Zakup nie może przyznawać REAL XP, rangi, verified damage ani zaliczać questów. Monetyzujemy AI, statystyki i kosmetykę.</Text></View>
  <View style={s.panel}><Text style={s.label}>SERVER ENTITLEMENT // {entitlement?.active?'ACTIVE':'FAIL-CLOSED'}</Text><Text style={s.title}>{entitlement?.plan??'FREE'}</Text><Text style={s.body}>{entitlement?.active?('PROVIDER '+(entitlement.provider??'SERVER')+(entitlement.validUntil?' · VALID TO '+new Date(entitlement.validUntil).toLocaleDateString():'')):'Billing provider nie jest jeszcze podłączony. Aplikacja nie może sama nadać sobie Premium.'}</Text></View>
  {SHOP_OFFERS.map(o=><View key={o.id} style={s.panel}><Text style={s.label}>{o.kind} // {o.priceLabel}</Text><Text style={s.title}>{o.name}</Text><Text style={s.body}>{o.benefits.join(' · ')}</Text><Text style={s.body}>PAY TO WIN // NO</Text>{o.kind==='SUBSCRIPTION'&&!entitlement?.active&&<Text style={s.body}>PURCHASE // WAITING FOR GOOGLE PLAY PRODUCT CONFIGURATION</Text>}</View>)}
  <View style={s.panel}><Text style={s.label}>SPONSOR CHALLENGES 2.0 // VERIFIED SERVER PROGRESS</Text><Text style={s.title}>{rows.length} ACTIVE</Text><Text style={s.body}>Postęp pochodzi z verification summaries i reward ledgeru. Telefon nie wysyła sobie punktów.</Text><Action label={busy?'SYNCING…':'ODŚWIEŻ SPONSOR NETWORK'} disabled={busy} onPress={()=>void load()}/></View>
  {error&&<SystemError message={error} retry={()=>void load()}/>}
  {rows.map(row=><View key={row.id} style={s.panel}><Text style={s.label}>SPONSORED // {row.sponsor_name} // {row.tier}</Text><Text style={s.title}>{row.title}</Text><Text style={s.body}>{row.description}</Text><Text style={s.body}>{row.verified_value} / {row.target} {row.unit} · REWARD {row.reward_kind}: {row.reward_label}</Text>{!row.joined&&<Action label="DOŁĄCZ DO WYZWANIA" disabled={busy} onPress={()=>void join(row.id)}/>} {row.completed&&<Text style={s.body}>COMPLETE // reward claim utworzony po stronie serwera.</Text>}</View>)}
 </SystemPage>;
}