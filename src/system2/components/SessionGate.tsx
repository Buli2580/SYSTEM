import { Modal, Text, View } from 'react-native';
import { useSystem } from '../state/SystemProvider';
import OnboardingScreen from '../screens/OnboardingScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SystemError from './SystemError';

export default function SessionGate() {
  const { ready, error, refreshPlayer, onboardingComplete, awakeningCompleted, goals } = useSystem();
  const needsFirstGoal = ready && onboardingComplete && !awakeningCompleted && goals.length === 0;
  if (ready && onboardingComplete && !needsFirstGoal) return null;

  return <Modal visible={!ready || !onboardingComplete || needsFirstGoal} animationType="fade" onRequestClose={() => {}}>
    {!ready
      ? <View style={{ flex: 1, backgroundColor: '#030709', justifyContent: 'center', padding: 24 }}>
          {error ? <SystemError message={error} retry={() => { void refreshPlayer(); }} /> : <Text style={{ color: '#6ceeff' }}>SYSTEM // URUCHAMIANIE</Text>}
        </View>
      : !onboardingComplete
        ? <OnboardingScreen />
        : <GoalsScreen />}
  </Modal>;
}
