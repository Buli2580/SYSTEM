import {useEffect,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import {antiCheat2Decision} from '../verification/antiCheat2';
import {flushAmplitude,queueTelemetry} from '../telemetry/amplitude';
import {getLocalCloudSyncStatus,flushCloudOutbox} from '../cloud/sync';
import {nextSyncDelay} from '../cloud/offlineSync2';
export default function SystemLabScreen(){const [sync,setSync]=useState({pending:0,synced:0,failed:0});const [telemetry,setTelemetry]=useState('NOT CHECKED');async function load(){setSync(await getLocalCloudSyncStatus())}useEffect(()=>{void load()},[]);const backoff=nextSyncDelay(sync.failed,sync.pending,sync.failed?'NETWORK':undefined);const anti=antiCheat2Decision([]);return <SystemPage title="SYSTEM LAB" subtitle="ANTI-CHEAT // TELEMETRY // OFFLINE SYNC">
 <View style={s.panel}><Text style={s.label}>ANTI-CHEAT 2.0</Text><Text style={s.title}>{anti.action} // RISK {anti.score}</Text><Text style={s.body}>Nowe sygnały: mocked location, teleport, replay, background jump. Brak sygnałów w tym podglądzie = ACCEPT.</Text></View>
 <View style={s.panel}><Text style={s.label}>OFFLINE SYNC 2.0</Text><Text style={s.title}>{sync.pending} PENDING</Text><Text style={s.body}>SYNCED {sync.synced} · FAILED {sync.failed} · next retry {Math.round(backoff.delayMs/1000)} s · {backoff.priority}</Text><Action label="SYNC NOW" onPress={()=>{void flushCloudOutbox(100).then(load)}}/></View>
 <View style={s.panel}><Text style={s.label}>AMPLITUDE TELEMETRY</Text><Text style={s.title}>{telemetry}</Text><Text style={s.body}>Kolejka działa bez SDK. Wysyłka ruszy po ustawieniu EXPO_PUBLIC_AMPLITUDE_API_KEY.</Text><Action label="QUEUE TEST EVENT" onPress={()=>{void queueTelemetry({event_type:'SYSTEM_LAB_TEST'}).then(()=>setTelemetry('QUEUED'))}}/><Action label="FLUSH AMPLITUDE" onPress={()=>{void flushAmplitude().then(x=>setTelemetry(x.pending?'KEY/OFFLINE · QUEUED':'SENT '+x.sent))}}/></View>
 </SystemPage>}