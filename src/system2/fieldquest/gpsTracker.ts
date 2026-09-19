import * as Location from 'expo-location';
import type { GPSQuestTrackerState } from './types';
import type { LocationObject } from 'expo-location';
import { distanceBetween, isUsableLocation, verifiedSegment, verificationScoreForAccuracy } from '../verification/gps';

export class GPSQuestTracker {
  private state: GPSQuestTrackerState = {
    startingLocation: null,
    latestLocation: null,
    accumulatedDistance: 0,
    elapsedTime: 0,
    sampleCount: 0,
    accuracy: null,
    trackingStatus: 'IDLE',
    lastError: null,
  };

  private startTime: number | null = null;
  private previousLocation: LocationObject | null = null;
  private watcher: Location.LocationSubscription | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private onStateChange: ((state: GPSQuestTrackerState) => void) | null = null;
  private pausedElapsed: number = 0;

  constructor(onStateChange?: (state: GPSQuestTrackerState) => void) {
    this.onStateChange = onStateChange ?? null;
  }

  private emit() {
    if (this.onStateChange) this.onStateChange({ ...this.state });
  }

  getState(): GPSQuestTrackerState {
    return { ...this.state };
  }

  async start(): Promise<boolean> {
    try {
      this.state.trackingStatus = 'STARTING';
      this.emit();

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        this.state.trackingStatus = 'ERROR';
        this.state.lastError = 'Location permission denied';
        this.emit();
        return false;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        this.state.trackingStatus = 'ERROR';
        this.state.lastError = 'Location services disabled';
        this.emit();
        return false;
      }

      this.watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (location) => this.processLocation(location),
        (error: string) => {
          this.state.trackingStatus = 'ERROR';
          this.state.lastError = error;
          this.emit();
        }
      );

      this.startTime = Date.now();
      this.pausedElapsed = 0;
      this.previousLocation = null;
      this.state.accumulatedDistance = 0;
      this.state.sampleCount = 0;
      this.state.trackingStatus = 'TRACKING';
      this.emit();

      this.interval = setInterval(() => {
        if (this.startTime) {
          this.state.elapsedTime = this.pausedElapsed + Math.floor((Date.now() - this.startTime) / 1000);
          this.emit();
        }
      }, 1000);

      return true;
    } catch (error) {
      this.state.trackingStatus = 'ERROR';
      this.state.lastError = error instanceof Error ? error.message : 'Failed to start GPS tracking';
      this.emit();
      return false;
    }
  }

  pause() {
    if (this.watcher) {
      this.watcher.remove();
      this.watcher = null;
    }
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.startTime) {
      this.pausedElapsed += Math.floor((Date.now() - this.startTime) / 1000);
      this.startTime = null;
    }
    this.state.trackingStatus = 'PAUSED';
    this.emit();
  }

  resume() {
    if (this.state.trackingStatus !== 'PAUSED') return;
    this.start();
  }

  stop() {
    if (this.watcher) {
      this.watcher.remove();
      this.watcher = null;
    }
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.startTime = null;
    this.previousLocation = null;
    this.state.trackingStatus = 'IDLE';
    this.emit();
  }

  reset() {
    this.stop();
    this.state = {
      startingLocation: null,
      latestLocation: null,
      accumulatedDistance: 0,
      elapsedTime: 0,
      sampleCount: 0,
      accuracy: null,
      trackingStatus: 'IDLE',
      lastError: null,
    };
    this.pausedElapsed = 0;
    this.emit();
  }

  private processLocation(location: LocationObject) {
    if (!isUsableLocation(location)) return;

    this.state.latestLocation = location;
    this.state.accuracy = location.coords.accuracy;
    this.state.sampleCount++;

    if (!this.state.startingLocation) {
      this.state.startingLocation = location;
    }

    if (this.previousLocation) {
      const segment = verifiedSegment(this.previousLocation, location);
      if (segment > 0) {
        this.state.accumulatedDistance += segment;
      }
    }
    this.previousLocation = location;
    this.emit();
  }

  getProgress() {
    return {
      distanceMeters: this.state.accumulatedDistance,
      elapsedTime: this.state.elapsedTime,
      sampleCount: this.state.sampleCount,
      currentAccuracy: this.state.accuracy,
      lastUpdate: Date.now(),
    };
  }

  getAccumulatedDistance(): number {
    return this.state.accumulatedDistance;
  }

  getElapsedTime(): number {
    return this.state.elapsedTime;
  }

  getSampleCount(): number {
    return this.state.sampleCount;
  }

  getCurrentAccuracy(): number | null {
    return this.state.accuracy;
  }

  isTracking(): boolean {
    return this.state.trackingStatus === 'TRACKING';
  }

  getTrackingStatus(): GPSQuestTrackerState['trackingStatus'] {
    return this.state.trackingStatus;
  }
}