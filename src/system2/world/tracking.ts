import type { RewardReceipt } from '../core/rewards';
import type * as Location from 'expo-location';
import type { WorldSave } from '../storage/world';
import type * as WorldStorage from '../storage/world';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import { acceptWorldLocation } from './location';
import { signalReached } from './signals';
import { locationToSector } from './sectors';

export type TrackingStatus = 'PAUSED' | 'STARTING' | 'ACTIVE' | 'DENIED' | 'ERROR';
export type WorldTrackingState = WorldSave & {
  status: TrackingStatus; fix: Location.LocationObject | null; error: string | null;
  permanentDenial: boolean; scanning: boolean; feedback: string | null; feedbackId: number;
};
type Dependencies = {
  location: Pick<typeof Location, 'requestForegroundPermissionsAsync' | 'hasServicesEnabledAsync' | 'getCurrentPositionAsync' | 'watchPositionAsync'>;
  storage: Pick<typeof WorldStorage, 'loadWorld' | 'discoverSector' | 'scanSignal' | 'locateSignal'>;
  accuracy: Location.Accuracy;
  foreground: () => boolean;
  unlocked: () => boolean;
  changed: (state: WorldTrackingState) => void;
  rewarded: (receipt?: RewardReceipt) => void;
  feedback: () => void;
  timeoutMs?: number;
};
export class WorldTracking {
  state: WorldTrackingState = { status: 'PAUSED', fix: null, error: null, permanentDenial: false,
    scanning: false, feedback: null, feedbackId: 0, sectorIds: [], signal: null, signalError: false };
  private epoch = 0;
  private watcher: Location.LocationSubscription | null = null;
  private watchdog: ReturnType<typeof setTimeout> | undefined;
  private previous: Location.LocationObject | null = null;
  private known = new Set<string>();
  private processing = false;
  constructor(private deps: Dependencies) {}
  private update(patch: Partial<WorldTrackingState>) { this.state = { ...this.state, ...patch }; this.deps.changed(this.state); }
  private valid(epoch: number) { return epoch === this.epoch && this.deps.unlocked(); }
  private active(epoch: number) { return this.valid(epoch) && this.watcher !== null && this.deps.foreground(); }
  private deadline<T>(promise: Promise<T>) { return awaitWithTimeout(promise, this.deps.timeoutMs ?? 20000); }
  stop(status: TrackingStatus = 'PAUSED', error: string | null = null) {
    this.epoch++;
    const watcher = this.watcher;
    this.watcher = null;
    try { watcher?.remove(); } catch { /* Already removed by native location provider. */ }
    clearTimeout(this.watchdog);
    this.previous = null;
    this.processing = false;
    this.update({ status, error, scanning: false, fix: null });
  }
  onAppState(state: string) {
    // A permission dialog may report inactive/background while STARTING.
    // Startup checks foreground again before and after establishing the watcher.
    if (state !== 'active' && this.watcher !== null) this.stop('PAUSED');
  }
  private armWatchdog() {
    clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => this.stop('ERROR', 'Brak wiarygodnego sygnału GPS. Spróbuj ponownie na zewnątrz.'), 45000);
  }
  async hydrate() {
    const epoch = this.epoch;
    try {
      const save = await this.deadline(this.deps.storage.loadWorld());
      if (this.valid(epoch)) { this.known = new Set(save.sectorIds); this.update(save); }
    } catch (error) { if (this.valid(epoch)) this.stop('ERROR', message(error)); }
  }
  async start() {
    if (!this.deps.unlocked() || this.state.status === 'STARTING' || this.watcher) return;
    const epoch = ++this.epoch;
    this.update({ status: 'STARTING', error: null, permanentDenial: false, fix: null });
    try {
      const save = await this.deadline(this.deps.storage.loadWorld());
      if (!this.valid(epoch)) return;
      this.known = new Set(save.sectorIds); this.update(save);
      const permission = await this.deadline(this.deps.location.requestForegroundPermissionsAsync());
      if (!this.valid(epoch)) return;
      if (!permission.granted) {
        this.stop('DENIED', 'Brak zgody na lokalizację.');
        this.update({ permanentDenial: !permission.canAskAgain }); return;
      }
      if (!await this.deadline(this.deps.location.hasServicesEnabledAsync())) throw new Error('Włącz usługi lokalizacji GPS.');
      if (!this.valid(epoch)) return;
      if (!this.deps.foreground()) { this.stop(); return; }
      const fix = await this.deadline(this.deps.location.getCurrentPositionAsync({ accuracy: this.deps.accuracy }));
      if (!this.valid(epoch)) return;
      if (!acceptWorldLocation(fix, null)) throw new Error('Pierwszy pomiar GPS jest niedokładny lub nieaktualny. Spróbuj ponownie.');
      if (!this.deps.foreground()) { this.stop(); return; }
      const pending = this.deps.location.watchPositionAsync(
        { accuracy: this.deps.accuracy, timeInterval: 1000, distanceInterval: 0 },
        next => { if (this.active(epoch)) void this.accept(next, epoch); },
        () => { if (this.valid(epoch)) this.stop('ERROR', 'Pomiar GPS został przerwany. Spróbuj ponownie.'); }
      ).then(watcher => {
        if (!this.valid(epoch) || !this.deps.foreground()) { watcher.remove(); return null; }
        return watcher;
      });
      const watcher = await this.deadline(pending);
      if (!this.valid(epoch)) { watcher?.remove(); return; }
      if (!watcher) { this.stop(); return; }
      // Only an actual subscription activates tracking, never the permission step.
      this.watcher = watcher;
      this.update({ status: 'ACTIVE' });
      this.armWatchdog();
      await this.accept(fix, epoch);
    } catch (error) { if (this.valid(epoch)) this.stop('ERROR', message(error)); }
  }
  private async accept(fix: Location.LocationObject, epoch: number) {
    if (!this.active(epoch) || this.processing || !acceptWorldLocation(fix, this.previous)) return;
    if (this.previous && fix.timestamp - this.previous.timestamp < 1000) return;
    this.previous = fix;
    this.armWatchdog();
    this.update({ fix });
    const sectorId = locationToSector(fix.coords);
    const signal = this.state.signal;
    if (this.known.has(sectorId) && (!signal || signal.status === 'LOCATED' || !signalReached(fix, signal))) return;
    this.processing = true;
    try {
      if (!this.known.has(sectorId)) {
        const result = await this.deadline(this.deps.storage.discoverSector(fix, () => this.active(epoch)));
        if (!this.active(epoch)) return;
        this.known.add(result.sectorId);
        this.update({ sectorIds: [...this.known] });
        if (result.discovered) { this.announce('SEKTOR ODKRYTY'); this.deps.rewarded(); }
      }
      if (signal?.status === 'DETECTED' && signalReached(fix, signal) && this.active(epoch)) {
        const result = await this.deadline(this.deps.storage.locateSignal(fix, signal.revision, () => this.active(epoch)));
        if (!this.active(epoch)) return;
        this.update({ signal: result.signal });
        if (result.awarded) { this.announce('SYGNAŁ ODNALEZIONY'); this.deps.rewarded(result.receipt); }
      }
    } catch (error) { if (this.valid(epoch)) this.stop('ERROR', message(error)); }
    finally { if (this.valid(epoch)) this.processing = false; }
  }
  private announce(feedback: string) {
    this.update({ feedback, feedbackId: this.state.feedbackId + 1 }); this.deps.feedback();
  }
  async scan(relocate = false) {
    const epoch = this.epoch;
    const fix = this.state.fix;
    if (!this.active(epoch) || !fix || this.state.scanning) return;
    this.update({ scanning: true, error: null });
    try {
      const signal = await this.deadline(this.deps.storage.scanSignal(fix, relocate, this.state.signal?.revision, () => this.active(epoch)));
      if (this.active(epoch)) this.update({ signal, signalError: false });
    } catch (error) { if (this.valid(epoch)) this.stop('ERROR', message(error)); }
    finally { if (this.valid(epoch)) this.update({ scanning: false }); }
  }
}
function message(error: unknown) { return error instanceof Error ? error.message : 'Błąd SYSTEM WORLD. Spróbuj ponownie.'; }
