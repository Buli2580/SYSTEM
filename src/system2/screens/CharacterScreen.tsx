import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import CharacterCard from '../components/CharacterCard';
import SystemError from '../components/SystemError';
import { useSystem } from '../state/SystemProvider';
import { SKILL_KEYS, SKILL_META, type SkillKey } from '../core';
import { dominantSkill, type AvatarStyle } from '../identity/model';
import { persistAvatar, removeOwnedAvatar } from '../identity/avatar';
import { playFeedback } from '../identity/audio';
import { titlePl } from '../i18n/pl';

const STYLES: Array<{ id: AvatarStyle; title: string; text: string }> = [
  { id: 'DARK', title: 'MROCZNY ŁOWCA', text: 'Ciemniejsza aura i agresywny profil karty.' },
  { id: 'CYBER', title: 'CYBER SYSTEM', text: 'Błękitny HUD, skan i technologiczny rdzeń.' },
  { id: 'WARLORD', title: 'WŁADCA', text: 'Ciepła, ciężka aura i wygląd wysokiej rangi.' },
];

export default function CharacterScreen() {
  const { player, titles, updateIdentity, settings, saveSettings } = useSystem();
  const router = useRouter();
  const [name, setName] = useState(player.displayName);
  const [selected, setSelected] = useState<SkillKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  const avatarStyle = settings.avatarStyle ?? 'CYBER';

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => setName(player.displayName), [player.id, player.displayName]);

  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try { await task(); }
    catch (cause) {
      if (__DEV__) console.error('[SYSTEM identity] Operation failed', cause);
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Nie udało się zapisać tożsamości.');
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function chooseAvatar(camera: boolean) {
    playFeedback('UI_TAP');
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error('Brak zgody na aparat. Zmień uprawnienia w ustawieniach aplikacji.');
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.85, exif: false, base64: false,
    };
    const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !mounted.current) return;
    const asset = result.assets[0];
    if (!asset?.uri) throw new Error('Nie otrzymano obrazu z galerii lub aparatu.');
    const uri = await persistAvatar(asset.uri);
    if (!mounted.current) { removeOwnedAvatar(uri); return; }
    await updateIdentity({ avatarUri: uri });
    removeOwnedAvatar(player.avatarUri);
    playFeedback('SYSTEM_WAKE');
  }

  async function selectStyle(style: AvatarStyle) {
    playFeedback('UI_TAP');
    await saveSettings({ ...settings, avatarStyle: style });
  }

  return <SystemPage title="POSTAĆ" subtitle="CHARACTER FORGE 2.0">
    <CharacterCard player={player} style={avatarStyle} archetype={String(dominantSkill(player))} />

    <View style={s.panel}>
      <Text style={s.label}>CHARACTER FORGE // ŹRÓDŁO</Text>
      <Text style={s.body}>Zdjęcie jest przechowywane lokalnie jako avatar. Aparat i galeria są podpięte bez wysyłania surowej fotografii do telemetrii.</Text>
      <View style={styles.row}>
        <Pressable style={styles.forgeButton} disabled={busy} onPress={() => { void run(() => chooseAvatar(true)); }}>
          <Text style={styles.forgeButtonText}>APARAT</Text>
        </Pressable>
        <Pressable style={styles.forgeButton} disabled={busy} onPress={() => { void run(() => chooseAvatar(false)); }}>
          <Text style={styles.forgeButtonText}>GALERIA</Text>
        </Pressable>
      </View>
      {player.avatarUri && <Action label="USUŃ AVATAR" disabled={busy} onPress={() => { void run(async () => {
        await updateIdentity({ avatarUri: null }); removeOwnedAvatar(player.avatarUri); playFeedback('UI_TAP');
      }); }} />}
    </View>

    <View style={s.panel}>
      <Text style={s.label}>STYL POSTACI</Text>
      {STYLES.map(item => {
        const active = item.id === avatarStyle;
        return <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          disabled={busy}
          onPress={() => { void run(() => selectStyle(item.id)); }}
          style={[styles.styleCard, active && styles.styleActive]}
        >
          <Text style={[styles.styleMark, active && styles.activeText]}>{active ? '◆' : '◇'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.styleTitle, active && styles.activeText]}>{item.title}</Text>
            <Text style={styles.styleText}>{item.text}</Text>
          </View>
        </Pressable>;
      })}
      <Text style={s.body}>Wygląd aury i ramki ewoluuje automatycznie wraz z REAL LEVEL i rangą.</Text>
    </View>

    <View style={s.panel}>
      <Text style={s.label}>NAZWA W SYSTEMIE</Text>
      <TextInput
        accessibilityLabel="Zmień nazwę w SYSTEMIE"
        value={name}
        onChangeText={setName}
        maxLength={24}
        style={styles.input}
      />
      <Action label="ZAPISZ NAZWĘ" disabled={busy} onPress={() => { void run(async () => {
        await updateIdentity({ displayName: name }); playFeedback('UI_TAP');
      }); }} />
    </View>

    <View style={s.panel}>
      <Text style={s.label}>ZDOBYTE TYTUŁY</Text>
      {titles.map(title => <Action
        key={title}
        label={`${player.currentTitle === title ? '✓ ' : ''}${titlePl(title)}`}
        disabled={busy}
        onPress={() => { void run(async () => { await updateIdentity({ currentTitle: title }); playFeedback('UI_TAP'); }); }}
      />)}
    </View>

    <Text style={s.title}>7 CECH REAL</Text>
    {SKILL_KEYS.map(key => {
      const skill = player.stats[key];
      return <Pressable
        key={key}
        accessibilityRole="button"
        accessibilityLabel={`${key}, poziom ${skill.level}, szczegóły`}
        onPress={() => { playFeedback('UI_TAP'); setSelected(selected === key ? null : key); }}
        style={s.panel}
      >
        <Text style={s.label}>{key} // {SKILL_META[key].name}</Text>
        <Text style={s.title}>LV. {skill.level}</Text>
        <Text style={s.body}>{skill.xp} / {skill.xpToNextLevel} XP · do awansu {skill.xpToNextLevel - skill.xp} XP</Text>
        <Progress value={skill.xp} max={skill.xpToNextLevel} />
        {selected === key && <Text style={s.body}>{SKILL_META[key].description} XP przyznają wyłącznie dostępne, zweryfikowane aktywności SYSTEMU.</Text>}
      </Pressable>;
    })}
    {error && <SystemError message={error} retry={() => setError(null)} />}
    <Action label="HISTORIA SYSTEMU →" onPress={() => router.push('/system-log')} />
  </SystemPage>;
}

function Progress({ value, max }: { value: number; max: number }) {
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }} style={styles.progress}>
    <View style={[styles.progressFill, { width: `${Math.min(100, value / Math.max(1, max) * 100)}%` }]} />
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  forgeButton: { flex: 1, borderWidth: 1, borderColor: '#2d6675', backgroundColor: '#07171d', paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  forgeButtonText: { color: '#62efff', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  styleCard: { flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#17333e', backgroundColor: '#061014', borderRadius: 16, padding: 15, marginTop: 9 },
  styleActive: { borderColor: '#62efff', backgroundColor: '#082028' },
  styleMark: { color: '#5d737c', fontSize: 20, width: 28 },
  styleTitle: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  activeText: { color: '#62efff' },
  styleText: { color: '#77909a', fontSize: 10, lineHeight: 16, marginTop: 5 },
  input: { color: '#fff', minHeight: 48, borderBottomWidth: 1, borderBottomColor: '#417480', marginBottom: 10 },
  progress: { width: '100%', height: 6, backgroundColor: '#17333e', borderRadius: 4, marginVertical: 12, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#62efff', borderRadius: 4 },
});
