import { TelemetryProvider } from './TelemetryProvider';
import type { TelemetryEvent, TelemetryProperties } from './TelemetryEvent';

const IS_DEV = typeof __DEV__ === 'boolean' ? __DEV__ : (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

export class ConsoleTelemetryProvider implements TelemetryProvider {
  private buffer: { event: TelemetryEvent; properties?: TelemetryProperties; timestamp: number }[] = [];

  trackEvent(event: TelemetryEvent, properties?: TelemetryProperties): void {
    const entry = { event, properties, timestamp: Date.now() };
    this.buffer.push(entry);
    if (IS_DEV) {
      console.log('[TELEMETRY]', event, properties ?? {});
    }
  }

  async flush(): Promise<void> {
    this.buffer = [];
  }
}

export const telemetry = new ConsoleTelemetryProvider();