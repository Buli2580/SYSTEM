// SYSTEM 2.0 - MapLibre Map Provider
// MapLibre GL Native implementation for React Native / Expo

import type { LocationObject } from 'expo-location';
import type { Camera } from '@maplibre/maplibre-react-native';
import {
  MapProvider,
  MapProviderConfig,
  MapCamera,
  MapMarker,
  MapPolyline,
  MapPolygon,
  MapStyle,
  CameraMode,
  MapViewport,
} from './mapProvider';

interface MapLibreConfig extends MapProviderConfig {
  styleUrl?: string;
  accessToken?: string;
}

export class MapLibreProvider implements MapProvider {
  name: 'maplibre' = 'maplibre';
  private mapRef: any = null;
  private camera: any = null;
  private cameraMode: CameraMode = 'follow';
  private markers = new Map<string, any>();
  private polylines = new Map<string, any>();
  private polygons = new Map<string, any>();
  private layers = new Map<string, any>();
  private viewportChangeCallbacks: Array<(viewport: MapViewport) => void> = [];
  private mapClickCallbacks: Array<(coordinate: { latitude: number; longitude: number }) => void> = [];
  private markerPressCallbacks: Array<(markerId: string) => void> = [];
  private cameraIdleCallbacks: Array<() => void> = [];
  private isReadyFlag = false;
  private mapStyle = 'standard';
  private is3DModeFlag = false;

  async initialize(config: MapProviderConfig): Promise<void> {
    this.isReadyFlag = true;
  }

  async destroy(): Promise<void> {
    if (this.mapRef) {
      this.mapRef = null;
      this.camera = null;
      this.markers.clear();
      this.polylines.clear();
      this.polygons.clear();
      this.layers.clear();
    }
  }

  setMapRef(ref: any): void {
    this.mapRef = ref;
  }

  setCameraRef(camera: any): void {
    this.camera = camera;
  }

  async getCamera(): Promise<MapCamera> {
    if (!this.camera) {
      return {
        center: { latitude: 0, longitude: 0 },
        zoom: 17,
        bearing: 0,
        pitch: 0,
      };
    }

    try {
      const state = await this.mapRef?.getCamera?.();
      if (state) {
        return {
          center: { latitude: state.center[1], longitude: state.center[0] },
          zoom: state.zoom,
          bearing: state.bearing || 0,
          pitch: state.pitch || 0,
        };
      }
    } catch {}

    return {
      center: { latitude: 0, longitude: 0 },
      zoom: 17,
      bearing: 0,
      pitch: 0,
    };
  }

  async setCamera(camera: MapCamera, animated = true, duration = 500): Promise<void> {
    if (!this.mapRef) return;

    try {
      if (this.mapRef.animateCamera) {
        await this.mapRef.animateCamera({
          center: [camera.center.longitude, camera.center.latitude],
          zoom: camera.zoom,
          bearing: camera.bearing || 0,
          pitch: camera.pitch || 0,
        }, { duration });
      }
    } catch (error) {
      console.warn('Failed to set camera:', error);
    }
  }

  async animateCamera(camera: MapCamera, duration = 500): Promise<void> {
    return this.setCamera(camera, true, duration);
  }

  async fitBounds(coordinates: Array<{ latitude: number; longitude: number }>, padding = 50): Promise<void> {
  }

  getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  async setCameraMode(mode: CameraMode): Promise<void> {
    this.cameraMode = mode;
  }

  // Markers
  async addMarker(marker: { id: string; coordinate: { latitude: number; longitude: number }; title?: string; description?: string; icon?: string; anchor?: { x: number; y: number }; onPress?: () => void }): Promise<string> {
    const id = marker.id || `marker_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.markers.set(marker.id || id, { ...marker, id });
    return marker.id || id;
  }

  async removeMarker(id: string): Promise<void> {
    this.markers.delete(id);
  }

  async updateMarker(id: string, updates: Partial<{ id: string; coordinate: { latitude: number; longitude: number }; title?: string; description?: string; icon?: string; anchor?: { x: number; y: number }; onPress?: () => void }>): Promise<void> {
    const existing = this.markers.get(id);
    if (existing) {
      this.markers.set(id, { ...existing, ...updates });
    }
  }

  async clearMarkers(): Promise<void> {
    this.markers.clear();
  }

  // Polylines
  async addPolyline(polyline: { id: string; coordinates: Array<{ latitude: number; longitude: number }>; color?: string; width?: number; lineCap?: 'round' | 'square' | 'butt'; lineJoin?: 'round' | 'miter' | 'bevel' }): Promise<string> {
    const id = polyline.id || `polyline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.polylines.set(polyline.id || id, { ...polyline, id });
    return polyline.id || id;
  }

  async removePolyline(id: string): Promise<void> {
    this.polylines.delete(id);
  }

  async updatePolyline(id: string, updates: Partial<{ id: string; coordinates: Array<{ latitude: number; longitude: number }>; color?: string; width?: number; lineCap?: 'round' | 'square' | 'butt'; lineJoin?: 'round' | 'miter' | 'bevel' }>): Promise<void> {
    const existing = this.polylines.get(id);
    if (existing) {
      this.polylines.set(id, { ...existing, ...updates });
    }
  }

  async clearPolylines(): Promise<void> {
    this.polylines.clear();
  }

  // Polygons
  async addPolygon(polygon: { id: string; coordinates: Array<Array<{ latitude: number; longitude: number }>>; fillColor?: string; fillOpacity?: number; strokeColor?: string; strokeWidth?: number }): Promise<string> {
    const id = polygon.id || `polygon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.polygons.set(polygon.id || id, { ...polygon, id });
    return polygon.id || id;
  }

  async removePolygon(id: string): Promise<void> {
    this.polygons.delete(id);
  }

  async updatePolygon(id: string, updates: Partial<{ id: string; coordinates: Array<Array<{ latitude: number; longitude: number }>>; fillColor?: string; fillOpacity?: number; strokeColor?: string; strokeWidth?: number }>): Promise<void> {
    const existing = this.polygons.get(id);
    if (existing) {
      this.polygons.set(id, { ...existing, ...updates });
    }
  }

  async clearPolygons(): Promise<void> {
    this.polygons.clear();
  }

  // Layers
  async addGeoJSONLayer(id: string, geojson: any): Promise<void> {
    this.layers.set(id, { id, geojson, visible: true });
  }

  async removeLayer(id: string): Promise<void> {
    this.layers.delete(id);
  }

  async setLayerVisibility(id: string, visible: boolean): Promise<void> {
    const layer = this.layers.get(id);
    if (layer) {
      layer.visible = visible;
    }
  }

  async setLayerStyle(id: string, style: Record<string, unknown>): Promise<void> {
    const layer = this.layers.get(id);
    if (layer) {
      layer.style = { ...layer.style, ...style };
    }
  }

  // Style
  async setMapStyle(style: string | 'standard' | 'satellite' | 'hybrid' | 'dark' | 'custom'): Promise<void> {
    this.mapStyle = typeof style === 'string' ? style : 'standard';
  }

  async getMapStyle(): Promise<string> {
    return this.mapStyle;
  }

  // Viewport
  async getViewport(): Promise<MapViewport> {
    return {
      center: { latitude: 0, longitude: 0 },
      zoom: 17,
      bearing: 0,
      pitch: 0,
    };
  }

  onViewportChange(callback: (viewport: MapViewport) => void): () => void {
    this.viewportChangeCallbacks.push(callback);
    return () => {
      const index = this.viewportChangeCallbacks.indexOf(callback);
      if (index >= 0) this.viewportChangeCallbacks.splice(index, 1);
    };
  }

  onMapClick(callback: (coordinate: { latitude: number; longitude: number }) => void): () => void {
    this.mapClickCallbacks.push(callback);
    return () => {
      const index = this.mapClickCallbacks.indexOf(callback);
      if (index >= 0) this.mapClickCallbacks.splice(index, 1);
    };
  }

  onMarkerPress(callback: (markerId: string) => void): () => void {
    this.markerPressCallbacks.push(callback);
    return () => {
      const index = this.markerPressCallbacks.indexOf(callback);
      if (index >= 0) this.markerPressCallbacks.splice(index, 1);
    };
  }

  onCameraIdle(callback: () => void): () => void {
    this.cameraIdleCallbacks.push(callback);
    return () => {
      const index = this.cameraIdleCallbacks.indexOf(callback);
      if (index >= 0) this.cameraIdleCallbacks.splice(index, 1);
    };
  }

  isReady(): boolean {
    return this.isReadyFlag;
  }

  getMapProviderName(): 'maplibre' {
    return 'maplibre';
  }

  async takeSnapshot(): Promise<string | null> {
    try {
      return null;
    } catch {
      return null;
    }
  }

  async set3DMode(enabled: boolean, options?: { pitch?: number; bearing?: number }): Promise<void> {
    this.is3DModeFlag = enabled;
  }

  is3DMode(): boolean {
    return this.is3DModeFlag;
  }
}

export default MapLibreProvider;