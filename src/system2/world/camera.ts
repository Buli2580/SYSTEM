// SYSTEM 2.0 - Camera System
// Camera modes and transitions for 2D/3D map

import type { MapCamera, CameraMode } from '../world/mapProvider';

export type CameraTransitionConfig = {
  duration: number;
  easing?: (t: number) => number;
  delay?: number;
};

export const CAMERA_TRANSITIONS: Record<string, CameraTransitionConfig> = {
  follow: { duration: 600, easing: (t: number) => t * (2 - t) },
  free: { duration: 400, easing: (t: number) => t * (2 - t) },
  north_up: { duration: 500, easing: (t: number) => t * (2 - t) },
  heading_up: { duration: 500, easing: (t: number) => t * (2 - t) },
  overview: { duration: 800, easing: (t: number) => t * (2 - t) },
  '3d': { duration: 1000, easing: (t: number) => t * (2 - t) },
};

export function createCameraController() {
  const mode = { current: 'follow' as CameraMode };
  const is3D = { current: false };

  const setMode = (newMode: CameraMode) => {
    mode.current = newMode;
  };

  const set3DMode = (enabled: boolean, options?: { pitch?: number; bearing?: number }) => {
    is3D.current = enabled;
  };

  return {
    mode,
    is3D,
    setMode,
    set3DMode,
  };
}

export function useCameraController() {
  const mode = { current: 'follow' as CameraMode };
  const is3D = { current: false };
  const transition = { current: 0 };
  const pitch = { current: 0 };
  const bearing = { current: 0 };

  const setMode = (newMode: CameraMode) => {
    mode.current = newMode;
  };

  const set3DMode = (enabled: boolean, options?: { pitch?: number; bearing?: number }) => {
    is3D.current = enabled;
  };

  return {
    mode,
    is3D,
    setMode,
    set3DMode,
  };
}