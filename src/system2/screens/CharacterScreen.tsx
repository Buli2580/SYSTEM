import StreakMilestoneCard from '../components/StreakMilestoneCard';
import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { useSystem } from '../state/SystemProvider';
import type { SkillKey } from '../core';
import { persistAvatar, removeOwnedAvatar } from '../identity/avatar';
import CharacterProgressPanel from '../components/CharacterProgressPanel';
import { titlePl } from '../i18n/pl';

export default function CharacterScreen() {
  const { player, titles, updateIdentity, completedQuestIds, daily, activeQuestId, progression } = useSystem();
  const router = useRouter();
  const [birthDate, setBirthDate] = useState(player.birthDate ?? '');
  useEffect(() => setBirthDate(player.birthDate ?? ''), [player.id, player.birthDate]);
  const [name, setName] = useState(player.displayName), [selected, setSelected] = useState<SkillKey | null>(null);
  const [error, setError] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const lock = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => setName(player.displayName), [player.id, player.displayName]);
  async function run(task: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError(null);
    try { await task(); } catch (cause) { if (__DEV__) console.error('[SYSTEM identity] Operation failed', cause); if (mounted.current) setError(cause instanceof Error ? cause.message : 'Nie udało się zapisać tożsamości.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function chooseAvatar(camera: boolean) {
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error('Brak zgody na aparat. Zmień uprawnienia w ustawieniach aplikacji.');
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, exif: false, base64: false };
    const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !mounted.current) return;
    const asset = result.assets[0];
    if (!asset?.uri) throw new Error('Nie otrzymano obrazu z galerii lub aparatu.');
    const uri = await persistAvatar(asset.uri);
    if (!mounted.current) { removeOwnedAvatar(uri); return; }
    // Do not delete a newly copied image on an ambiguous SQLite timeout: the
    // commit may still finish. Full reset removes the app-owned avatar directory.
    await updateIdentity({ avatarUri: uri });
    removeOwnedAvatar(player.avatarUri);
  }
  return <SystemPage title="POSTAĆ" subtitle="SYSTEM IDENTITY">
    <CharacterProgressPanel player={player} completedQuestIds={completedQuestIds} daily={daily} activeQuestId={activeQuestId} selectedSkill={selected} onSelectSkill={key => setSelected(selected === key ? null : key)} />
    {progression && <StreakMilestoneCard days={progression.streak.currentStreak} />}
    <View style={s.panel}>
      <Text style={s.label}>NAZWA W SYSTEMIE</Text>
      <TextInput accessibilityLabel="Zmień nazwę w SYSTEMIE" value={name} onChangeText={setName} maxLength={24} style={{ color: '#fff', minHeight: 48, borderBottomWidth: 1, borderBottomColor: '#417480' }} />
      <Action label="ZAPISZ NAZWĘ" disabled={busy} onPress={() => { void run(() => updateIdentity({ displayName: name })); }} />
      <Text style={s.label}>DATA URODZENIA · RRRR-MM-DD</Text>
      <TextInput accessibilityLabel="Data urodzenia" value={birthDate} onChangeText={setBirthDate} maxLength={10} placeholder="RRRR-MM-DD" keyboardType="numbers-and-punctuation" style={{color:'#fff',minHeight:48}} />
      <Action label="ZAPISZ DATĘ URODZENIA" disabled={busy} onPress={() => { void run(() => updateIdentity({birthDate})); }} />
      <Action label="AVATAR Z GALERII" disabled={busy} onPress={() => { void run(() => chooseAvatar(false)); }} />
      <Action label="ZRÓB ZDJĘCIE" disabled={busy} onPress={() => { void run(() => chooseAvatar(true)); }} />
      {player.avatarUri && <Action label="USUŃ AVATAR" disabled={busy} onPress={() => { void run(async () => { await updateIdentity({ avatarUri: null }); removeOwnedAvatar(player.avatarUri); }); }} />}
      {error && <SystemError message={error} retry={() => setError(null)} />}
    </View>
    <View style={s.panel}><Text style={s.label}>ZDOBYTE TYTUŁY</Text>
      {titles.map(title => <Action key={title} label={`${player.currentTitle === title ? '✓ ' : ''}${titlePl(title)}`} disabled={busy} onPress={() => { void run(() => updateIdentity({ currentTitle: title })); }} />)}
    </View>
    <Action label="CELE →" onPress={() => router.push('/goals')} />
    <Action label="OSIĄGNIĘCIA →" onPress={() => router.push('/achievements')} />
    <Action label="SYSTEM LOG →" onPress={() => router.push('/system-log')} />
  </SystemPage>;
}
