import { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSystem } from '../state/SystemProvider';
import { notificationAsync } from '../identity/feedback';
export default function LevelUpCelebration() {
  const { celebration, dismissCelebration, ready } = useSystem();
  useEffect(() => {
    if (!celebration || !ready) return;
    void notificationAsync();
    const timer = setTimeout(dismissCelebration, 3000);
    return () => clearTimeout(timer);
  }, [celebration, dismissCelebration, ready]);
  if (!celebration || !ready) return null;
  const level = celebration.afterLevel > celebration.beforeLevel;
  return <Modal transparent animationType="fade" onRequestClose={dismissCelebration}>
    <Pressable accessibilityRole="button" accessibilityLabel="Pomiń animację awansu" onPress={dismissCelebration} style={{ flex: 1, backgroundColor: '#02090ff5', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Animated.View entering={FadeIn.duration(500)} style={{ position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#0b3944', opacity: 0.5 }} />
      <Animated.View entering={FadeInUp.duration(400)}>
        <Text style={{ color: '#6ceeff', fontWeight: '900', textAlign: 'center', letterSpacing: 4 }}>{level ? 'LEVEL UP' : 'SKILL LEVEL UP'}</Text>
        {level && <Text style={{ color: '#fff', fontSize: 64, fontWeight: '900', textAlign: 'center' }}>LV. {celebration.afterLevel}</Text>}
        {celebration.beforeRank !== celebration.afterRank && <Text style={{ color: '#e4baff', textAlign: 'center', marginTop: 16 }}>RANK PROMOTION · {celebration.beforeRank} → {celebration.afterRank}</Text>}
        {celebration.skillLevels.map(skill => <Text key={skill.key} style={{ color: '#cff9ff', textAlign: 'center', marginTop: 12 }}>{skill.key} LV.{skill.before} → LV.{skill.after}</Text>)}
        <View style={{ marginTop: 30 }}><Text style={{ color: '#adbfc8', textAlign: 'center' }}>Dotknij, aby kontynuować</Text></View>
      </Animated.View>
    </Pressable>
  </Modal>;
}
