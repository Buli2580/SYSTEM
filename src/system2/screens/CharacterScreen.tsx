import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import IdentityAvatar from '../components/IdentityAvatar';
import SystemError from '../components/SystemError';
import { useSystem } from '../state/SystemProvider';
import { SKILL_KEYS, SKILL_META, type SkillKey } from '../core';
import { dominantSkill } from '../identity/model';
import { persistAvatar, removeOwnedAvatar } from '../identity/avatar';
import { titlePl } from '../i18n/pl';

export default function CharacterScreen() {
  const { player, titles, updateIdentity } = useSystem();
  const router = useRouter();
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
  return <SystemPage title="POSTAĆ" subtitle="TOŻSAMOŚĆ SYSTEMU">
    <View style={[s.panel, { alignItems: 'center' }]}>
      <IdentityAvatar uri={player.avatarUri} evolution={player.avatarEvolution} />
      <Text style={s.title}>{player.displayName}</Text><Text style={s.label}>{titlePl(player.currentTitle)}</Text>
      <Text style={[s.value, { fontSize: 40 }]}>REAL LEVEL {player.realLevel}</Text>
      <Text style={s.body}>RANGA {player.rank} · ETAP EWOLUCJI {player.avatarEvolution}</Text>
      <Text style={s.body}>{player.realXp} / {player.realXpToNextLevel} REAL XP</Text>
      <Progress value={player.realXp} max={player.realXpToNextLevel} />
      <Text style={s.body}>DOMINUJĄCA CECHA · {dominantSkill(player)}</Text><Text style={s.label}>ARCHETYP // NIEUKSZTAŁTOWANY</Text>
    </View>
    <View style={s.panel}>
      <Text style={s.label}>NAZWA W SYSTEMIE</Text>
      <TextInput accessibilityLabel="Zmień nazwę w SYSTEMIE" value={name} onChangeText={setName} maxLength={24} style={{ color: '#fff', minHeight: 48, borderBottomWidth: 1, borderBottomColor: '#417480' }} />
      <Action label="ZAPISZ NAZWĘ" disabled={busy} onPress={() => { void run(() => updateIdentity({ displayName: name })); }} />
      <Action label="AVATAR Z GALERII" disabled={busy} onPress={() => { void run(() => chooseAvatar(false)); }} />
      <Action label="ZRÓB ZDJĘCIE" disabled={busy} onPress={() => { void run(() => chooseAvatar(true)); }} />
      {player.avatarUri && <Action label="USUŃ AVATAR" disabled={busy} onPress={() => { void run(async () => { await updateIdentity({ avatarUri: null }); removeOwnedAvatar(player.avatarUri); }); }} />}
      {error && <SystemError message={error} retry={() => setError(null)} />}
    </View>
    <View style={s.panel}><Text style={s.label}>ZDOBYTE TYTUŁY</Text>
      {titles.map(title => <Action key={title} label={`${player.currentTitle === title ? '✓ ' : ''}${titlePl(title)}`} disabled={busy} onPress={() => { void run(() => updateIdentity({ currentTitle: title })); }} />)}
    </View>
    <Text style={s.title}>7 CECH REAL</Text>
    {SKILL_KEYS.map(key => { const skill = player.stats[key]; return <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${key}, poziom ${skill.level}, szczegóły`} onPress={() => setSelected(selected === key ? null : key)} style={s.panel}>
      <Text style={s.label}>{key} // {SKILL_META[key].name}</Text><Text style={s.title}>LV. {skill.level}</Text>
      <Text style={s.body}>{skill.xp} / {skill.xpToNextLevel} XP · do awansu {skill.xpToNextLevel - skill.xp} XP</Text>
      <Progress value={skill.xp} max={skill.xpToNextLevel} />
      {selected === key && <Text style={s.body}>{SKILL_META[key].description} XP przyznają wyłącznie dostępne, zweryfikowane aktywności SYSTEMU.</Text>}
    </Pressable>; })}
    <Action label="HISTORIA SYSTEMU →" onPress={() => router.push('/system-log')} />
  </SystemPage>;
}
function Progress({ value, max }: { value: number; max: number }) {
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }} style={{ width: '100%', height: 5, backgroundColor: '#17333e', borderRadius: 4, marginVertical: 12 }}>
    <View style={{ width: `${Math.min(100, value / max * 100)}%`, height: 5, backgroundColor: '#62efff', borderRadius: 4 }} />
  </View>;
}
