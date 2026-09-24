import { validateBirthDate } from '../identity/age';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import SystemBootSequence from '../components/SystemBootSequence';
import { useSystem } from '../state/SystemProvider';
import { SKILL_KEYS, SYSTEM_COLORS as C } from '../core';
import {queueTelemetry} from '../telemetry/amplitude';
import {useAnimationEngine4} from '../components/AnimationEngine4Provider';

const pages = [
  { code: '00 // SIGNAL', title: 'SYSTEM WYKRYTY', kicker: 'TWOJE ŻYCIE STAJE SIĘ GRĄ', body: 'Nie tworzysz bohatera w fikcyjnym świecie. Rozwijasz siebie, a SYSTEM zapisuje prawdziwy postęp.' },
  { code: '01 // ORIGIN', title: 'RÓWNY START', kicker: 'REAL LEVEL 1 · RANGA E', body: 'Każdy startuje z tego samego punktu. Twoja przeszłość może zmieniać trudność, ale nie daje darmowego poziomu.' },
  { code: '02 // RULE', title: 'PRAWDZIWE DZIAŁANIA', kicker: 'ZERO FAŁSZYWEGO XP', body: 'Misja → prawdziwa aktywność → weryfikacja → XP → rozwój postaci. Nagroda pojawia się dopiero po potwierdzeniu działania.' },
  { code: '03 // DIRECTOR', title: 'AI GAME MASTER', kicker: 'CEL ZAMIENIA SIĘ W ŚCIEŻKĘ', body: 'Po utworzeniu postaci wybierzesz pierwszy cel. AI przygotuje kierunek, a SYSTEM od razu otworzy pierwszą linię questów.' },
  { code: '04 // PREFERENCES', title: 'DOPASUJ SYSTEM', kicker: 'MOVE // DAILY // AI', body: 'Wybierz aktywności, które naprawdę chcesz wykonywać. Generator misji nie powinien wciskać Ci biegu albo roweru, jeśli tego nie wybierzesz.' },
  { code: '05 // IDENTITY', title: 'STWÓRZ POSTAĆ', kicker: 'PLAYER CORE // INITIALIZATION', body: 'Nadaj sobie nazwę SYSTEMU. Zaczynasz jako REAL LEVEL 1, RANGA E i siedem równych atrybutów.' },
] as const;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [booting, setBooting] = useState(true);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activities,setActivities]=useState({walking:true,running:false,cycling:false});
  const busyRef = useRef(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const motion = useAnimationEngine4();
  const { finishOnboarding,saveSettings } = useSystem();
  const identityStep = step === pages.length - 1;
  const preferencesStep = step === pages.length - 2;
  useEffect(()=>{void queueTelemetry({event_type:'ONBOARDING_START'})},[]);

  async function enter() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await finishOnboarding(name, validateBirthDate(birthDate));
      await saveSettings({activities});
      await queueTelemetry({event_type:'ONBOARDING_COMPLETE',event_properties:{walking:activities.walking,running:activities.running,cycling:activities.cycling}});
      router.replace('/goals');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nie udało się zapisać SYSTEM IDENTITY.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return <View style={styles.root}>
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.topline}>
          <Text style={styles.system}>SYSTEM // AWAKENING 2.0</Text>
          <Text style={styles.counter}>{step + 1}/{pages.length}</Text>
        </View>
        <View style={styles.progressRow}>
          {pages.map((_, index) => <View key={index} style={[styles.progressSegment, index <= step && styles.progressSegmentActive]} />)}
        </View>

        <Animated.View key={step} entering={motion.reducedMotion?undefined:FadeInUp.duration(motion.duration('normal'))} style={styles.hero}>
          <View style={styles.coreWrap}>
            <Animated.View entering={motion.reducedMotion?undefined:FadeIn.duration(motion.duration('hero'))} style={styles.coreOuter}>
              <View style={styles.coreInner} />
            </Animated.View>
          </View>
          <Text style={styles.code}>{pages[step].code}</Text>
          <Text style={styles.title}>{pages[step].title}</Text>
          <Text style={styles.kicker}>{pages[step].kicker}</Text>
          <Text style={styles.body}>{pages[step].body}</Text>

          {preferencesStep&&<View style={styles.identity}>
            <Text style={styles.inputLabel}>AKTYWNOŚCI DAILY / MOVE</Text>
            {([
              ['walking','SPACER / WALK'],
              ['running','BIEGANIE / RUN'],
              ['cycling','ROWER / BIKE'],
            ] as const).map(([key,label])=><Pressable key={key} accessibilityRole="button" onPress={()=>setActivities(x=>({...x,[key]:!x[key]}))} style={[styles.preference,activities[key]&&styles.preferenceActive]}>
              <Text style={[styles.preferenceText,activities[key]&&styles.preferenceTextActive]}>{activities[key]?'◆':'◇'} {label}</Text>
            </Pressable>)}
            <Text style={styles.privacy}>Preferencje trafiają do generatora Daily i AI Game Mastera. Możesz je później zmienić.</Text>
          </View>}
          {identityStep && <View style={styles.identity}>
            <View style={styles.playerHeader}>
              <View><Text style={styles.mini}>PLAYER CORE</Text><Text style={styles.playerLevel}>LV. 1</Text></View>
              <View style={styles.rankBadge}><Text style={styles.rankText}>RANK E</Text></View>
            </View>
            <View style={styles.stats}>
              {SKILL_KEYS.map(key => <View key={key} style={styles.stat}><Text style={styles.statCode}>{key}</Text><Text style={styles.statValue}>1</Text></View>)}
            </View>
            <Text style={styles.inputLabel}>SYSTEM NAME</Text>
            <TextInput accessibilityLabel="SYSTEM NAME — pseudonim" value={name} onChangeText={setName} maxLength={24}
              autoCorrect={false} placeholder="Twój pseudonim" placeholderTextColor={C.textVeryMuted} style={styles.input} />
            <Text style={styles.inputLabel}>DATA URODZENIA · RRRR-MM-DD</Text>
            <TextInput accessibilityLabel="Data urodzenia RRRR-MM-DD" value={birthDate} onChangeText={setBirthDate} maxLength={10}
              autoCorrect={false} placeholder="RRRR-MM-DD" placeholderTextColor={C.textVeryMuted}
              keyboardType="numbers-and-punctuation" style={styles.input} />
            <Text style={styles.privacy}>Data zostaje na telefonie. SYSTEM używa wieku do zasad bezpieczeństwa i dopasowania doświadczenia.</Text>
          </View>}
        </Animated.View>

        {error && <SystemError message={error} retry={() => { void enter(); }} />}
        <View style={styles.actions}>
          <Action disabled={busy || booting} label={identityStep ? busy ? 'TWORZENIE PLAYER CORE…' : 'UTWÓRZ POSTAĆ →' : 'DALEJ →'}
            onPress={() => identityStep ? void enter() : setStep(value => Math.min(pages.length - 1, value + 1))} />
          {step > 0 && <Action disabled={busy || booting} label="WSTECZ" onPress={() => setStep(value => Math.max(0, value - 1))} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    <SystemBootSequence visible={booting} firstRun onComplete={() => setBooting(false)} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  system: { flex: 1, minWidth: 0, color: C.cyan, fontSize: 9, lineHeight: 14, fontWeight: '900', letterSpacing: 1.4 },
  counter: { flexShrink: 0, marginLeft: 10, color: C.textMuted, fontSize: 9, fontWeight: '900' },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 13 },
  progressSegment: { flex: 1, height: 3, borderRadius: 3, backgroundColor: C.line },
  progressSegmentActive: { backgroundColor: C.cyan },
  hero: { marginTop: 30, padding: 22, borderWidth: 1, borderColor: C.lineBright, borderRadius: 24, backgroundColor: C.panel },
  coreWrap: { height: 118, alignItems: 'center', justifyContent: 'center' },
  coreOuter: { width: 82, height: 82, borderWidth: 1, borderColor: C.cyan, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,229,255,0.04)' },
  coreInner: { width: 34, height: 34, borderWidth: 2, borderColor: C.cyanSoft, backgroundColor: C.panelSoft },
  code: { color: C.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginTop: 8 },
  title: { color: C.white, fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 8, flexShrink: 1 },
  kicker: { color: C.cyanSoft, fontSize: 11, lineHeight: 17, fontWeight: '900', letterSpacing: 1.05, marginTop: 14, flexShrink: 1 },
  body: { color: C.textMuted, fontSize: 15, lineHeight: 23, marginTop: 12, flexShrink: 1 },
  identity: { marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: C.line },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mini: { color: C.textVeryMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  playerLevel: { color: C.white, fontSize: 30, fontWeight: '900', marginTop: 4 },
  rankBadge: { borderWidth: 1, borderColor: C.cyan, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  rankText: { color: C.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 15 },
  stat: { minWidth: 54, flexGrow: 1, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 9, alignItems: 'center' },
  statCode: { color: C.cyan, fontSize: 8, fontWeight: '900' },
  statValue: { color: C.white, fontSize: 17, fontWeight: '900', marginTop: 3 },
  inputLabel: { color: C.cyan, fontSize: 9, lineHeight: 14, fontWeight: '900', letterSpacing: 1.1, marginTop: 18, flexShrink: 1 },
  input: { color: C.white, borderWidth: 1, borderColor: C.lineBright, borderRadius: 12, padding: 14, marginTop: 8, minHeight: 50 },
  privacy: { color: C.textVeryMuted, fontSize: 9, lineHeight: 14, marginTop: 8 },
  preference:{minHeight:50,justifyContent:'center',paddingHorizontal:14,borderRadius:12,borderWidth:1,borderColor:C.line,marginTop:8,backgroundColor:'rgba(255,255,255,.018)'},
  preferenceActive:{borderColor:C.cyan,backgroundColor:'rgba(0,229,255,.05)'},
  preferenceText:{color:C.textMuted,fontSize:11,fontWeight:'900'},
  preferenceTextActive:{color:C.cyan},
  actions: { marginTop: 14 },
});
