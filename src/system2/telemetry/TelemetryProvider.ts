import { TelemetryEvent, TelemetryProperties } from './TelemetryEvent';
import { ConsoleTelemetryProvider } from './ConsoleTelemetryProvider';

export interface TelemetryProvider {
  trackEvent(event: TelemetryEvent, properties?: TelemetryProperties): void;
  flush(): Promise<void>;
}

export abstract class BaseTelemetryProvider implements TelemetryProvider {
  abstract trackEvent(event: TelemetryEvent, properties?: TelemetryProperties): void;
  abstract flush(): Promise<void>;
}

export const telemetry = new ConsoleTelemetryProvider();