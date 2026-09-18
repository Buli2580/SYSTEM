import { Component, type ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import type { LocationObject } from 'expo-location';
import type { WorldSignal } from '../../world/signals';
import { configuredMapStyle } from '../../world/mapConfig';

export type WorldMapProps = { fix: LocationObject; sectorIds: string[]; signal: WorldSignal | null; follow: boolean; centerRequest: number };
function Fallback({ text }: { text: string }) {
  return <View style={{ flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#061017' }}>
    <Text style={{ color: '#62efff', fontSize: 18, fontWeight: '900' }}>MAP UNAVAILABLE</Text>
    <Text style={{ color: '#acc0cc', marginTop: 12 }}>{text}</Text>
  </View>;
}
class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <Fallback text="Nie można uruchomić MapLibre w tym buildzie. Wróć do ŚWIATA, aby ponowić próbę." /> : this.props.children; }
}
function MapContent(props: WorldMapProps) {
  const mapStyle = configuredMapStyle();
  if (!mapStyle) return <Fallback text="Źródło map nie jest jeszcze skonfigurowane. Odkrycia GPS i sygnał działają lokalnie; podkład mapy oczekuje na konfigurację." />;
  if (Platform.OS === 'web') return <Fallback text="Mapa SYSTEM WORLD wymaga Android Development Build lub iOS." />;
  // Deferred native import keeps locked World and missing native builds usable.
  const NativeWorldMap = require('./NativeWorldMap').default as typeof import('./NativeWorldMap').default;
  return <NativeWorldMap {...props} mapStyle={mapStyle} />;
}
export default function WorldMap(props: WorldMapProps) {
  return <MapBoundary><MapContent {...props} /></MapBoundary>;
}
