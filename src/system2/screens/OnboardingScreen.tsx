import { validateBirthDate } from '../identity/age';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { pageStyles as s } from '../components/SystemPage';
import { useSystem } from '../state/SystemProvider';
const pages = [
  ['SYSTEM', 'ROZWIJAJ SWOJE PRAWDZIWE ŻYCIE', 'Twoje prawdziwe działania rozwijają cyfrową postać.'],
  ['RÓWNY START', 'REAL LEVEL 1 · RANGA E', 'STR 1 · VIT 1 · INT 1 · WIL 1\nCHA 1 · CRE 1 · RES 1\n\nTwoja przeszłość ustala poziom trudności.\nNie ustala Twojego poziomu.'],
  ['PRAWDZIWE DZIAŁANIA', 'KAŻDE XP MA SWOJE ŹRÓDŁO', 'START\n↓\nPRAWDZIWA AKTYWNOŚĆ\n↓\nWERYFIKACJA\n↓\nXP\n↓\nROZWÓJ POSTACI'],
  ['PRZEBUDZENIE', 'TOŻSAMOŚĆ SYSTEMU', 'Wybierz pseudonim. Nie musisz podawać prawdziwego imienia. To Twoja lokalna tożsamość.'],
];
export default function OnboardingScreen() {
  const [step, setStep] = useState(0), [name, setName] = useState(''), [error, setError] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const busyRef = useRef(false); const insets = useSafeAreaInsets(); const router = useRouter();
  const { finishOnboarding } = useSystem();
  async function enter() {
    if (busyRef.current) return; busyRef.current = true; setBusy(true); setError(null);
    try { await finishOnboarding(name, validateBirthDate(birthDate)); router.replace('/'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Nie udało się zapisać SYSTEM IDENTITY.'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#030709' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 26, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }}>
      <Text style={s.label}>SYSTEM 2.0 // {step + 1}/4</Text>
      <Text style={[s.title, { fontSize: 34 }]}>{pages[step][0]}</Text>
      <Text style={[s.label, { marginTop: 24 }]}>{pages[step][1]}</Text>
      <Text style={[s.body, { fontSize: 16, lineHeight: 26, marginBottom: 24 }]}>{pages[step][2]}</Text>
      {step === 3 && <View><Text style={s.label}>SYSTEM NAME</Text><TextInput accessibilityLabel="SYSTEM NAME — pseudonim" value={name} onChangeText={setName} maxLength={24} autoCorrect={false} placeholder="Twój pseudonim" placeholderTextColor="#8397a3" style={{ color: '#fff', borderWidth: 1, borderColor: '#24505c', borderRadius: 12, padding: 16, marginVertical: 12 }} /><Text style={s.label}>DATA URODZENIA · RRRR-MM-DD</Text><TextInput accessibilityLabel="Data urodzenia RRRR-MM-DD" value={birthDate} onChangeText={setBirthDate} maxLength={10} autoCorrect={false} placeholder="RRRR-MM-DD" placeholderTextColor="#8397a3" keyboardType="numbers-and-punctuation" style={{ color: '#fff', borderWidth: 1, borderColor: '#24505c', borderRadius: 12, padding: 16, marginVertical: 12 }} /><Text style={s.body}>Data pozostaje na telefonie. Wiek obliczamy automatycznie.</Text></View>}
      {error && <SystemError message={error} retry={() => { void enter(); }} />}
      <Action disabled={busy} label={step === 3 ? busy ? 'ZAPISYWANIE…' : 'WEJDŹ DO SYSTEMU' : 'DALEJ →'} onPress={() => step === 3 ? void enter() : setStep(step + 1)} />
      {step > 0 && <Action disabled={busy} label="WSTECZ" onPress={() => setStep(step - 1)} />}
    </ScrollView>
  </KeyboardAvoidingView>;
}
