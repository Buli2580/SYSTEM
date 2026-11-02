import { registerRootComponent } from 'expo';
import { decodeWorldMessage, encodeWorldMessage } from './bridge/protocol';
import { createWorldHost } from './bridge/host';
import metadata from './build-metadata.json';
import React, { useEffect, useState } from 'react';
import { Button, NativeModules, NativeEventEmitter, Text, View } from 'react-native';

const bridge = NativeModules.SystemWorldBridge;
const identity = { playerId: 'spike-fixture', profileGeneration: 0, sessionId: `spike-${Date.now()}` };
const snapshot = {
  displayName: 'TEMP SPIKE — no saved player',
  realLevel: 1,
  realXp: 0,
  skills: { STR: 1, VIT: 1, INT: 1, WIL: 1, CHA: 1, CRE: 1, RES: 1 },
  equippedItemIds: [],
  domainLevel: 1,
  activeQuestId: null,
};

function memoryJournal() {
  const records = new Map();
  return {
    async claim(key, fingerprint) {
      const existing = records.get(key);
      if (!existing) {
        const record = { fingerprint, state: 'PENDING' };
        records.set(key, record);
        return { claimed: true, record };
      }
      return { claimed: false, record: existing };
    },
    async complete(key, fingerprint) {
      const record = records.get(key);
      if (!record || record.fingerprint !== fingerprint || record.state !== 'PENDING') throw new Error('JOURNAL');
      record.state = 'APPLIED';
    },
  };
}

function App() {
  const [status, setStatus] = useState('Isolated RN host; fixture state only');
  const [panel, setPanel] = useState('none');
  useEffect(() => {
    if (!bridge) {
      setStatus('Native bridge unavailable');
      return;
    }
    let seq = 0;
    const envelope = (type, payload) => encodeWorldMessage({
      protocolVersion: 'SYSTEM_WORLD_BRIDGE_V1',
      type,
      messageId: `host-${++seq}`,
      timestamp: new Date().toISOString(),
      ...identity,
      stateRevision: 0,
      payload,
    });
    const send = (type, payload) => bridge.send(envelope(type, payload)).catch((e) => setStatus(String(e.message || e)));
    const host = createWorldHost({
      ...identity,
      stateRevision: 0,
      journal: memoryJournal(),
      execute: async (command, isCurrent) => {
        if (!isCurrent()) return 'CANCELLED';
        if (command.action === 'REQUEST_SNAPSHOT') {
          await send('WORLD_SNAPSHOT', snapshot);
          setStatus('Snapshot dispatched; render unverified');
          return 'APPLIED';
        }
        if (command.action === 'OPEN_PANEL') {
          setPanel(command.panel);
          setStatus(`Host opened ${command.panel}; no XP`);
          return 'APPLIED';
        }
        if (command.action === 'SET_QUALITY') {
          setStatus(`Host recorded quality ${command.quality}; no XP`);
          return 'APPLIED';
        }
        return 'CANCELLED';
      },
    });
    const events = new NativeEventEmitter(bridge);
    const message = events.addListener('WorldMessage', async (raw) => {
      const reply = await host.receive(raw);
      bridge.send(encodeWorldMessage(reply)).catch((e) => setStatus(String(e.message || e)));
    });
    const lifecycle = events.addListener('WorldLifecycle', (state) => {
      setStatus(`Lifecycle: ${state}`);
      if (state === 'PAUSED') {
        host.pause();
        send('WORLD_PAUSE', { reason: 'BACKGROUND' });
      }
      if (state === 'RESUMED') {
        host.resume();
        send('WORLD_RESUME', { reason: 'BACKGROUND' });
      }
      if (state === 'RESTART_REQUIRES_INIT') host.dispose();
    });
    return () => {
      message.remove();
      lifecycle.remove();
      host.dispose();
      bridge.dispose();
    };
  }, []);
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text>WORLD Foundation · separate fixture host</Text>
      <Text>{status}</Text>
      <Text>Panel presentation only: {panel}</Text>
      <Button
        disabled={!bridge}
        title="Open WORLD"
        onPress={() => bridge.launch(encodeWorldMessage({
          protocolVersion: 'SYSTEM_WORLD_BRIDGE_V1',
          type: 'WORLD_INIT',
          messageId: 'launch-1',
          timestamp: new Date().toISOString(),
          ...identity,
          stateRevision: 0,
          payload: { hostBuildSha: metadata.hostBuildSha, quality: 'LOW' },
        })).catch((e) => setStatus(String(e.message || e)))}
      />
      <Button disabled={!bridge} title="Dispose WORLD" onPress={() => bridge.dispose()} />
    </View>
  );
}
registerRootComponent(App);
