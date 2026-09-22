import { AppState, type AppStateStatus } from 'react-native';
import { flushCloudOutbox, getLocalCloudSyncStatus } from './sync';

export type AutoSyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
export type AutoSyncListener = (state: AutoSyncState) => void;

export class AutoCloudSync {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private stopped = true;
  private appState: AppStateStatus = AppState.currentState;
  private appStateSubscription: { remove(): void } | null = null;

  constructor(private listener?: AutoSyncListener, private intervalMs = 30_000) {}

  start() {
    if (!this.stopped) return;
    this.stopped = false;
    this.appState = AppState.currentState;
    this.appStateSubscription = AppState.addEventListener('change', this.onAppState);
    void this.syncNow();
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
  }

  async syncNow() {
    if (this.running || this.stopped || this.appState !== 'active') return;
    this.running = true;
    this.listener?.('syncing');
    try {
      await flushCloudOutbox();
      const status = await getLocalCloudSyncStatus();
      this.listener?.(status.pending === 0 ? 'synced' : 'offline');
    } catch {
      this.listener?.('error');
    } finally {
      this.running = false;
      this.schedule();
    }
  }

  private schedule() {
    if (this.stopped || this.timer) return;
    this.timer = setTimeout(() => { this.timer = null; void this.syncNow(); }, this.intervalMs);
  }

  private onAppState = (next: AppStateStatus) => {
    this.appState = next;
    if (next === 'active') void this.syncNow();
  };
}
