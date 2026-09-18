import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from '../identity/feedback';
import { useRouter } from 'expo-router';
import { SYSTEM_COLORS as C } from '../core';
import { useSystem } from '../state/SystemProvider';

// Presentation acknowledgement is independent of the already committed reward.
// If the app closes here, the celebration can be shown again without awarding XP.
export default function AwakeningCelebration() {
  const { ready, awakeningPending, acknowledgeAwakening, celebration, onboardingComplete } = useSystem();
  const router = useRouter();
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const visible = ready && onboardingComplete && awakeningPending && !celebration;
  const finish = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    try {
      await acknowledgeAwakening();
      router.replace('/');
    } catch {
      setError('Nagroda jest zapisana. Nie udało się zamknąć podsumowania. Spróbuj ponownie.');
    } finally { busyRef.current = false; }
  }, [acknowledgeAwakening, router]);
  useEffect(() => {
    if (!visible) return;
    setError(null);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    const timer = setTimeout(() => { void finish(); }, 5500);
    return () => clearTimeout(timer);
  }, [visible, finish]);
  return <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={() => { void finish(); }}>
    {visible && <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(700)} style={styles.core} />
      <Animated.Text entering={FadeIn.delay(200).duration(700)} style={styles.title}>AWAKENING COMPLETE</Animated.Text>
      <Animated.Text entering={FadeIn.delay(1500).duration(700)} style={styles.line}>SYSTEM ACCESS EXPANDED</Animated.Text>
      <Animated.Text entering={FadeIn.delay(2900).duration(700)} style={styles.line}>WORLD PROTOCOL UNLOCKED</Animated.Text>
      <Animated.Text entering={FadeIn.delay(3600).duration(600)} style={styles.reward}>CHAPTER 01 VERIFIED // REWARD SAVED</Animated.Text>
      {error && <><Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => { void finish(); }}><Text style={styles.line}>SPRÓBUJ PONOWNIE</Text></Pressable></>}
    </View>}
  </Modal>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
  core: { width: 72, height: 72, borderWidth: 2, borderColor: C.cyan, backgroundColor: C.panel, transform: [{ rotate: '45deg' }], marginBottom: 52 },
  title: { color: C.white, fontSize: 29, fontWeight: '900', textAlign: 'center', letterSpacing: 2 },
  line: { color: C.cyan, fontSize: 12, letterSpacing: 2, textAlign: 'center', marginTop: 28, fontWeight: '800' },
  reward: { color: C.textMuted, fontSize: 10, textAlign: 'center', marginTop: 38 },
  error: { color: C.text, fontSize: 13, textAlign: 'center', marginTop: 26 },
});
