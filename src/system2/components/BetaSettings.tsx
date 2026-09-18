import { useCallback, useRef, useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useSystem } from '../state/SystemProvider';
import { DEFAULT_ACTIVITIES } from '../daily/templates';
import { phoneProvider } from '../activity/capabilities';
import { requestReminderPermission } from '../notifications/service';
import { systemDiagnostics } from '../storage/database';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import { QUESTS } from '../quests/catalog';
import { DAILY_TEMPLATES } from '../daily/templates';
import { pageStyles as s } from './SystemPage';
import Action from './Action';
function permissionLabel(p: { granted: boolean; status: string }) { return p.granted ? 'GRANTED' : p.status === 'undetermined' ? 'NOT REQUESTED' : 'DENIED'; }
export default function BetaSettings() {
 const { player, settings, saveSettings, daily, awakeningCompleted, refreshPlayer, notificationError } = useSystem();
 const [time, setTime] = useState(settings.reminderTime ?? '19:00'), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
 const [permissions, setPermissions] = useState('Sprawdzanie uprawnień…'), [diagnostics, setDiagnostics] = useState('');
 const lock = useRef(false), mounted = useRef(false);
 useFocusEffect(useCallback(() => {
   mounted.current = true;
   void awaitWithTimeout(Promise.all([Location.getForegroundPermissionsAsync(), ImagePicker.getCameraPermissionsAsync(), Notifications.getPermissionsAsync()])).then(([gps,camera,notification]) => {
     if (mounted.current) setPermissions(`Location ${permissionLabel(gps)} · Camera ${permissionLabel(camera)} · Notifications ${permissionLabel(notification)} · Motion UNAVAILABLE`);
   }).catch(() => { if (mounted.current) setPermissions('Nie udało się odczytać uprawnień. Otwórz ekran ponownie.'); });
   return () => { mounted.current = false; };
 }, []));
 async function run(task: () => Promise<void>) {
   if (lock.current) return; lock.current = true; setBusy(true); setMessage('');
   try { await awaitWithTimeout(task()); } catch { if (mounted.current) setMessage('Nie udało się zapisać ustawień lub zaplanować przypomnienia. Spróbuj ponownie.'); }
   finally { lock.current = false; if (mounted.current) setBusy(false); }
 }
 const prefs = settings.activities ?? DEFAULT_ACTIVITIES;
 return <>
   <View style={s.panel}><Text style={s.label}>AVAILABLE ACTIVITIES</Text>
     {(['walking','running','cycling'] as const).map(key => <View key={key}><Text style={s.body}>{key.toUpperCase()}</Text><Switch accessibilityLabel={key} value={prefs[key]} disabled={busy} onValueChange={value => { void run(() => saveSettings({ ...settings, activities: { ...prefs, [key]: value } })); }} /></View>)}
     <Text style={s.body}>Zmiana wpływa na następny zestaw Daily. Dzisiejsze misje pozostają zapisane.</Text>
   </View>
   <View style={s.panel}><Text style={s.label}>DAILY REMINDER</Text>
     <Switch accessibilityLabel="Daily reminder" value={settings.dailyReminder ?? false} disabled={busy} onValueChange={value => { void run(async () => {
       if (value && !await requestReminderPermission()) { if (mounted.current) setMessage('Notifications DENIED — możesz zmienić zgodę w ustawieniach Androida.'); return; }
       const next = { ...settings, dailyReminder: value, reminderTime: time };
       await saveSettings(next);
     }); }} />
     <TextInput accessibilityLabel="Godzina przypomnienia HH:MM" value={time} onChangeText={setTime} maxLength={5} placeholder="19:00" placeholderTextColor="#758c93" style={{ color: '#fff', minHeight: 48 }} />
     <Action label="ZAPISZ GODZINĘ" disabled={busy} onPress={() => { void run(async () => {
       if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { setMessage('Wpisz godzinę HH:MM, np. 19:00.'); return; }
       await saveSettings({ ...settings, reminderTime: time });
     }); }} />
     <Text style={s.body}>Lokalne przypomnienia na 7 dni, odnawiane po otwarciu SYSTEMU. Android może opóźnić dostarczenie.</Text>
   </View>
   <View style={s.panel}><Text style={s.label}>PERMISSIONS</Text><Text style={s.body}>{permissions}</Text>
     <Text style={s.label}>VERIFICATION CAPABILITY // STANDARD</Text><Text style={s.body}>GPS ✓ (wymaga zgody) · STEPS — · MOTION — · WATCH —</Text>
     <Text style={s.body}>Brak zegarka nie blokuje Daily. STRICT jest niedostępny bez wymaganych źródeł.</Text></View>
   {__DEV__ && <View style={s.panel}><Text style={s.label}>SYSTEM DIAGNOSTICS</Text>
     <Text style={s.body}>ID {player.id.slice(0,8)} · APP {Constants.expoConfig?.version ?? '?'} · CATALOG {QUESTS.length + DAILY_TEMPLATES.length} · SECTORS {player.discoveredSectors}</Text>
     <Text style={s.body}>{JSON.stringify(phoneProvider.capabilities)} · {diagnostics}</Text>
     <Action label="RELOAD PROFILE" disabled={busy} onPress={() => { void run(refreshPlayer); }} />
     <Action label="RUN INTEGRITY CHECK" disabled={busy} onPress={() => { void run(async () => { const data = await systemDiagnostics(); if (mounted.current) setDiagnostics(`DB ${data.schema} · EVENTS ${data.events} · INTEGRITY ${data.integrity}`); }); }} />
   </View>}
   {!!notificationError && <Text style={s.body}>{notificationError}</Text>}
   {!!message && <Text style={s.body}>{message}</Text>}
 </>;
}
