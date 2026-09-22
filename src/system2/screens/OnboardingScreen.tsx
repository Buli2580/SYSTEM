import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Action from '../components/Action';
import CharacterCard from '../components/CharacterCard';
import SystemError from '../components/SystemError';
import { useSystem } from '../state/SystemProvider';
import { persistAvatar, removeOwnedAvatar } from '../identity/avatar';
import { playFeedback } from '../identity/audio';
import type { AvatarStyle } from '../identity/model';

const FORGE_STYLES: AvatarStyle[] = ['DARK', 'CYBER', 'WARLORD'];

export default function OnboardingScreen() {
  const [cinematic, setCinematic] = useState(true);
  const [signal, setSignal] = useState(0);
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>('CYBER');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { player, settings, finishOnboarding, updateIdentity, saveSettings } = useSystem();

  useEffect(() => {
    playFeedback('SYSTEM_WAKE');
    const timers = [
      setTimeout(() => setSignal(1), 550),
      setTimeout(() => setSignal(2), 1250),
      setTimeout(() => setSignal(3), 2100),
      setTimeout(() => setSignal(4), 3000),
      setTimeout(() => setCinematic(false), 3900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const previewPlayer = useMemo(() => ({
    ...player,
    displayName: name.trim() || 'PLAYER',
    avatarUri: avatarUri ?? undefined,
  }), [player, name, avatarUri]);

  async function chooseAvatar(camera: boolean) {
    setError(null);
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error('Aparat jest potrzebny, aby zrobić zdjęcie postaci.');
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.85, exif: false, base64: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.85, exif: false, base64: false });
      if (result.canceled) return;
      const source = result.assets[0]?.uri;
      if (!source) throw new Error('Nie udało się pobrać zdjęcia.');
      const owned = await persistAvatar(source);
      if (avatarUri) removeOwnedAvatar(avatarUri);
      setAvatarUri(owned);
      playFeedback('VERIFY');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nie udało się przygotować avatara.');
    }
  }

  async function enter() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await finishOnboarding(name);
      if (avatarUri) await updateIdentity({ avatarUri });
      await saveSettings({ ...settings, audio: true, avatarStyle });
      playFeedback('QUEST_START');
      router.replace({ pathname: '/quest', params: { questId: 'first_movement_v1' } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nie udało się aktywować SYSTEMU.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (cinematic) return <View style={styles.cinematic}>
    <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(250)} style={styles.cinematicInner}>
      {signal >= 1 && <Animated.Text entering={FadeIn.duration(400)} style={styles.signal}>SIGNAL DETECTED</Animated.Text>}
      {signal >= 2 && <Animated.View entering={FadeIn.duration(500)} style={styles.logo}><View style={styles.logoInner} /></Animated.View>}
      {signal >= 3 && <Animated.Text entering={FadeInDown.duration(500)} style={styles.system}>SYSTEM</Animated.Text>}
      {signal >= 4 && <Animated.Text entering={FadeInDown.duration(450)} style={styles.detected}>PLAYER DETECTED // ORIGIN CONFIRMED</Animated.Text>}
    </Animated.View>
  </View>;

  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 50 }]}>
      <Animated.View entering={FadeInDown.duration(450)}>
        <Text style={styles.kicker}>CINEMATIC AWAKENING // CHARACTER FORGE</Text>
        <Text style={styles.title}>STWÓRZ{'\n'}POSTAĆ</Text>
        <Text style={styles.description}>Równy start: REAL LEVEL 1 · RANGA E. Twoje prawdziwe działania od tej chwili budują postać.</Text>
      </Animated.View>

      <CharacterCard player={previewPlayer} style={avatarStyle} archetype="ORIGIN PLAYER" />

      <View style={styles.panel}>
        <Text style={styles.label}>NAZWA W SYSTEMIE</Text>
        <TextInput
          accessibilityLabel="Nazwa w SYSTEMIE — pseudonim"
          value={name}
          onChangeText={setName}
          maxLength={24}
          autoCorrect={false}
          placeholder="Twój pseudonim"
          placeholderTextColor="#60747d"
          style={styles.input}
        />
        <Text style={styles.label}>OBRAZ POSTACI</Text>
        <View style={styles.row}>
          <Pressable style={styles.option} disabled={busy} onPress={() => { playFeedback('UI_TAP'); void chooseAvatar(true); }}>
            <Text style={styles.optionText}>APARAT</Text>
          </Pressable>
          <Pressable style={styles.option} disabled={busy} onPress={() => { playFeedback('UI_TAP'); void chooseAvatar(false); }}>
            <Text style={styles.optionText}>GALERIA</Text>
          </Pressable>
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>STYL AURY</Text>
        <View style={styles.row}>
          {FORGE_STYLES.map(style => <Pressable
            key={style}
            onPress={() => { playFeedback('UI_TAP'); setAvatarStyle(style); }}
            style={[styles.styleOption, avatarStyle === style && styles.styleOptionActive]}
          >
            <Text style={[styles.styleText, avatarStyle === style && styles.activeText]}>{style}</Text>
          </Pressable>)}
        </View>
      </View>

      <View style={styles.flow}>
        <Text style={styles.flowTitle}>PIERWSZY LOOP</Text>
        <Text style={styles.flowText}>BRIEFING → START → ACTIVE → VERIFYING → XP → NEXT QUEST</Text>
      </View>

      {error && <SystemError message={error} retry={() => { void enter(); }} />}
      <Action disabled={busy || name.trim().length < 2} label={busy ? 'AKTYWACJA…' : 'AKTYWUJ SYSTEM → PIERWSZA MISJA'} onPress={() => { void enter(); }} />
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020608' },
  content: { flexGrow: 1, paddingHorizontal: 22 },
  cinematic: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  cinematicInner: { alignItems: 'center', justifyContent: 'center', minHeight: 360 },
  signal: { color: '#4d737d', fontSize: 9, fontWeight: '900', letterSpacing: 4, marginBottom: 35 },
  logo: { width: 118, height: 118, borderWidth: 2, borderColor: '#00e5ff', transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center', shadowColor: '#00e5ff', shadowOpacity: 0.9, shadowRadius: 25 },
  logoInner: { width: 42, height: 42, backgroundColor: '#00e5ff' },
  system: { color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: 12, marginTop: 55 },
  detected: { color: '#00e5ff', fontSize: 9, fontWeight: '900', letterSpacing: 2.5, marginTop: 18 },
  kicker: { color: '#62efff', fontSize: 9, fontWeight: '900', letterSpacing: 2.5 },
  title: { color: '#fff', fontSize: 39, lineHeight: 44, fontWeight: '900', marginTop: 10 },
  description: { color: '#82949c', fontSize: 14, lineHeight: 22, marginTop: 12, marginBottom: 22 },
  panel: { borderWidth: 1, borderColor: '#17333e', borderRadius: 24, backgroundColor: '#061014', padding: 18, marginTop: 14 },
  label: { color: '#62efff', fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  input: { color: '#fff', minHeight: 54, borderBottomWidth: 1, borderBottomColor: '#28505f', marginTop: 6, marginBottom: 19, fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 8, marginTop: 9 },
  option: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: '#28505f', borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  optionText: { color: '#62efff', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  styleOption: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: '#1b3944', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  styleOptionActive: { borderColor: '#62efff', backgroundColor: '#082028' },
  styleText: { color: '#617780', fontSize: 7, fontWeight: '900' },
  activeText: { color: '#62efff' },
  flow: { marginVertical: 18, padding: 16, borderLeftWidth: 3, borderLeftColor: '#62efff', backgroundColor: '#041014' },
  flowTitle: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  flowText: { color: '#62efff', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 8, lineHeight: 15 },
});
