import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Camera, Map, GeoJSONSource, Layer, type CameraRef } from '@maplibre/maplibre-react-native';
import type { WorldMapProps } from './WorldMap';
import { locationToSector } from '../../world/sectors';
import { buildFog } from '../../world/fog';

export default function NativeWorldMap({ fix, sectorIds, signal, follow, centerRequest, mapStyle }: WorldMapProps & { mapStyle: string }) {
  const camera = useRef<CameraRef>(null);
  const latestFix = useRef(fix); latestFix.current = fix;
  const [viewport, setViewport] = useState(() => locationToSector(fix.coords));
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const fog = useMemo(() => buildFog(viewport, new Set(sectorIds)), [viewport, sectorIds]);
  useEffect(() => {
    if (follow) camera.current?.easeTo({ center: [fix.coords.longitude, fix.coords.latitude], duration: 600 });
  }, [fix, follow, loaded]);
  useEffect(() => {
    const { longitude, latitude } = latestFix.current.coords;
    camera.current?.easeTo({ center: [longitude, latitude], zoom: 17, duration: 400 });
  }, [centerRequest]);
  useEffect(() => {
    if (loaded) return;
    const timeout = setTimeout(() => setFailed(true), 20000);
    return () => clearTimeout(timeout);
  }, [attempt, loaded]);
  if (failed) return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
    <Text style={{ color: '#fff' }}>MAP UNAVAILABLE — sprawdź źródło map i połączenie.</Text>
    <Pressable onPress={() => { setLoaded(false); setFailed(false); setAttempt(n => n + 1); }}><Text style={{ color: '#62efff', paddingTop: 20 }}>RETRY MAP</Text></Pressable>
  </View>;
  return <Map key={attempt} style={{ flex: 1 }} mapStyle={mapStyle} androidView="texture"
    attribution logo compass touchPitch={false}
    onDidFinishLoadingMap={() => setLoaded(true)} onDidFailLoadingMap={() => setFailed(true)}
    onRegionDidChange={event => {
      const [longitude, latitude] = event.nativeEvent.center;
      setViewport(locationToSector({ latitude, longitude }));
    }}>
    <Camera ref={camera} initialViewState={{ center: [fix.coords.longitude, fix.coords.latitude], zoom: 17 }} minZoom={15} maxZoom={19} />
    <GeoJSONSource id="world-fog" data={fog}>
      <Layer id="world-fog-fill" type="fill" paint={{ 'fill-color': '#03090f', 'fill-opacity': 0.96, 'fill-antialias': false }} />
    </GeoJSONSource>
    <GeoJSONSource id="player" data={{ type: 'Point', coordinates: [fix.coords.longitude, fix.coords.latitude] }}>
      <Layer id="player-point" type="circle" paint={{ 'circle-radius': 7, 'circle-color': '#62efff', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 }} />
    </GeoJSONSource>
    {signal && <GeoJSONSource id="unknown-signal" data={{ type: 'Point', coordinates: [signal.longitude, signal.latitude] }}>
      <Layer id="unknown-signal-point" type="circle" paint={{ 'circle-radius': 10, 'circle-color': signal.status === 'LOCATED' ? '#58efb0' : '#cb89ff', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' }} />
    </GeoJSONSource>}
  </Map>;
}
