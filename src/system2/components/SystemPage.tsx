import SystemScreen from './SystemScreen';
import SystemError from './SystemError';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SYSTEM_COLORS as C } from '../core';
import { useSystem } from '../state/SystemProvider';
import BottomNavigation from './BottomNavigation';
import SystemAmbientBackground from './SystemAmbientBackground';

export default function SystemPage({ title, subtitle, children, intensity = 'quiet' }: { title: string; subtitle: string; children: ReactNode; intensity?: 'quiet' | 'default' | 'hero' | 'world' }) {
  const insets = useSafeAreaInsets();
  const { ready, error, refreshPlayer } = useSystem();
  return <SystemScreen style={styles.root}>
    <SystemAmbientBackground intensity={intensity} />
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: 20, paddingBottom: 150 + insets.bottom }]}>
      <Text style={styles.code}>{subtitle}</Text>
      <Text style={styles.title}>{title}</Text>
      {ready ? children : <View style={styles.panel}>
        {error ? <SystemError message={error} retry={() => { void refreshPlayer(); }} /> : <Text style={styles.body}>SYSTEM // INITIALIZING</Text>}
      </View>}
    </ScrollView>
    <BottomNavigation />
  </SystemScreen>;
}
export const pageStyles = StyleSheet.create({
  panel: { padding: 20, marginTop: 16, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 20 },
  label: { color: C.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: C.white, fontSize: 23, fontWeight: '900', marginTop: 12 },
  body: { color: C.textMuted, fontSize: 13, lineHeight: 21, marginTop: 12 },
  value: { color: C.white, fontSize: 28, fontWeight: '900', marginTop: 10 },
  link: { color: C.cyan, fontSize: 12, fontWeight: '900', marginTop: 20 },
});
const styles = StyleSheet.create({
  ...pageStyles,
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 22 },
  code: { color: C.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: C.white, fontSize: 32, fontWeight: '900', marginTop: 12, marginBottom: 12 },
});
