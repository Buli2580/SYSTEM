import { Modal, Text, View } from 'react-native';
import { useSystem } from '../state/SystemProvider';
import OnboardingScreen from '../screens/OnboardingScreen';
import SystemError from './SystemError';
export default function SessionGate() {
  const { ready, error, refreshPlayer, onboardingComplete } = useSystem();
  if (ready && onboardingComplete) return null;
  return <Modal visible={!ready || !onboardingComplete} animationType="fade" onRequestClose={() => {}}>
    {ready ? <OnboardingScreen /> : <View style={{ flex: 1, backgroundColor: '#030709', justifyContent: 'center', padding: 24 }}>
      {error ? <SystemError message={error} retry={() => { void refreshPlayer(); }} /> : <Text style={{ color: '#6ceeff' }}>SYSTEM // INITIALIZING</Text>}
    </View>}
  </Modal>;
}
