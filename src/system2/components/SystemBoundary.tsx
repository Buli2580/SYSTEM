import { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import SystemError from './SystemError';
import { SYSTEM_COLORS as C } from '../core';
export default class SystemBoundary extends Component<{ children: ReactNode }, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { if (__DEV__) console.error('SYSTEM render error', error.message); }
  render() {
    return this.state.failed ? <View style={{ flex: 1, backgroundColor: C.background, justifyContent: 'center', padding: 24 }}>
      <SystemError message="Nie udało się wyświetlić ekranu. Zapisane dane pozostają w SYSTEMIE." retry={() => this.setState(s => ({ failed: false, attempt: s.attempt + 1 }))} />
    </View> : <View key={this.state.attempt} style={{ flex: 1 }}>{this.props.children}</View>;
  }
}
