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

  return (
    <Modal transparent animationType="fade" onRequestClose={dismissCelebration}>
      <Pressable accessibilityRole="button" accessibilityLabel="Pomiń animację awansu" onPress={dismissCelebration} style={{ flex: 1, backgroundColor: '#02090ff5', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Animated.View entering={FadeIn.duration(500)} style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#0b3944', opacity: 0.5 }} />
        <Animated.View entering={FadeIn.duration(650)} style={{ position: 'absolute', width: 250, height: 250, borderRadius: 125, borderWidth: 1, borderColor: '#6ceeff55', opacity: 0.8 }} />
        <Animated.View entering={FadeInUp.duration(420)} style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5, 17, 20, 0.9)', borderWidth: 1, borderColor: '#6ceeff55', borderRadius: 28, padding: 28, minWidth: 290 }}>
          <Text style={{ color: '#6ceeff', fontWeight: '900', textAlign: 'center', letterSpacing: 4, fontSize: 12 }}>{level ? 'AWANS POZIOMU' : 'AWANS CECHY'}</Text>
          {level && <Text style={{ color: '#fff', fontSize: 64, fontWeight: '900', textAlign: 'center', marginTop: 12 }}>LV. {celebration.afterLevel}</Text>}
          {celebration.beforeRank !== celebration.afterRank && <Text style={{ color: '#e4baff', textAlign: 'center', marginTop: 16, fontWeight: '800' }}>AWANS RANGI · {celebration.beforeRank} → {celebration.afterRank}</Text>}
          {celebration.skillLevels.map(skill => (
            <Text key={skill.key} style={{ color: '#cff9ff', textAlign: 'center', marginTop: 12, fontWeight: '700' }}>{skill.key} LV.{skill.before} → LV.{skill.after}</Text>
          ))}
          <View style={{ marginTop: 26, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(108, 238, 255, 0.08)', borderWidth: 1, borderColor: '#6ceeff44' }}>
            <Text style={{ color: '#adbfc8', textAlign: 'center', fontWeight: '700', letterSpacing: 1.4 }}>DOTKNIJ, ABY KONTYNUOWAĆ</Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
