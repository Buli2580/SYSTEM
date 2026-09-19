// SYSTEM 2.0 - Map Provider Interface
// Core map provider abstraction to avoid coupling to specific map providers

export type MapProviderName = 'maplibre' | 'mapbox' | 'google' | 'custom';

export type MapCamera = {
  center: { latitude: number; longitude: number };
  zoom: number;
  bearing?: number;
  pitch?: number;
  altitude?: number;
};

export type MapViewport = {
  center: { latitude: number; longitude: number };
  zoom: number;
  bearing?: number;
  pitch?: number;
};

export type MapMarker = {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  icon?: string;
  anchor?: { x: number; y: number };
  onPress?: () => void;
};

export type MapPolyline = {
  id: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  color?: string;
  width?: number;
  lineCap?: 'round' | 'square' | 'butt';
  lineJoin?: 'round' | 'miter' | 'bevel';
};

export type MapPolygon = {
  id: string;
  coordinates: Array<Array<{ latitude: number; longitude: number }>>;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
};

export type MapStyle = 'standard' | 'satellite' | 'hybrid' | 'dark' | 'custom';

export type CameraMode = 'follow' | 'free' | 'north_up' | 'heading_up' | 'overview' | '3d';

export type MapProviderConfig = {
  name?: 'maplibre' | 'mapbox' | 'google' | 'custom';
  apiKey?: string;
  styleUrl?: string;
  customStyle?: Record<string, unknown>;
  maxZoom?: number;
  minZoom?: number;
  tileSize?: number;
};

export interface MapProvider {
  name: MapProviderName;
  
  // Initialization
  initialize(config: MapProviderConfig): Promise<void>;
  destroy(): Promise<void>;
  
  // Camera control
  getCamera(): Promise<MapCamera>;
  setCamera(camera: MapCamera, animated?: boolean, duration?: number): Promise<void>;
  animateCamera(camera: MapCamera, duration?: number): Promise<void>;
  fitBounds(coordinates: Array<{ latitude: number; longitude: number }>, padding?: number): Promise<void>;
  
  // Camera modes
  getCameraMode(): CameraMode;
  setCameraMode(mode: CameraMode): Promise<void>;
  
  // Markers
  addMarker(marker: MapMarker): Promise<string>;
  removeMarker(id: string): Promise<void>;
  updateMarker(id: string, updates: Partial<MapMarker>): Promise<void>;
  clearMarkers(): Promise<void>;
  
  // Polylines
  addPolyline(polyline: MapPolyline): Promise<string>;
  removePolyline(id: string): Promise<void>;
  updatePolyline(id: string, updates: Partial<MapPolyline>): Promise<void>;
  clearPolylines(): Promise<void>;
  
  // Polygons
  addPolygon(polygon: MapPolygon): Promise<string>;
  removePolygon(id: string): Promise<void>;
  updatePolygon(id: string, updates: Partial<MapPolygon>): Promise<void>;
  clearPolygons(): Promise<void>;
  
  // Layers
  addGeoJSONLayer(id: string, geojson: any): Promise<void>;
  removeLayer(id: string): Promise<void>;
  setLayerVisibility(id: string, visible: boolean): Promise<void>;
  setLayerStyle(id: string, style: Record<string, unknown>): Promise<void>;
  
  // Style
  setMapStyle(style: MapStyle | string): Promise<void>;
  getMapStyle(): Promise<string>;
  
  // Viewport
  getViewport(): Promise<MapViewport>;
  onViewportChange(callback: (viewport: MapViewport) => void): () => void;
  
  // Map interactions
  onMapClick(callback: (coordinate: { latitude: number; longitude: number }) => void): () => void;
  onMarkerPress(callback: (markerId: string) => void): () => void;
  onCameraIdle(callback: () => void): () => void;
  
  // Map state
  isReady(): boolean;
  getMapProviderName(): MapProviderName;
  
  // Snapshot/Export
  takeSnapshot(): Promise<string | null>;
  
  // 3D
  set3DMode(enabled: boolean, options?: { pitch?: number; bearing?: number }): Promise<void>;
  is3DMode(): boolean;
}

export interface MapProviderFactory {
  createProvider(name: MapProviderName, config?: MapProviderConfig): MapProvider;
  registerProvider(name: MapProviderName, factory: () => MapProvider): void;
  getSupportedProviders(): MapProviderName[];
}