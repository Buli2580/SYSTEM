import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import * as SecureStore from 'expo-secure-store';

export type MusicState = 
  | 'BOOT'
  | 'HOME'
  | 'CHARACTER'
  | 'EXPLORE'
  | 'QUEST'
  | 'FIELD_QUEST'
  | 'WARNING'
  | 'BOSS'
  | 'VICTORY'
  | 'SILENT';

export type AudioTrack = {
  key: string;
  uri: string;
  loop?: boolean;
  volume?: number;
  category: 'music' | 'sfx' | 'ambient';
};

export type SFXEvent = 
  | 'UI_CLICK'
  | 'UI_CONFIRM'
  | 'UI_CANCEL'
  | 'UI_NAVIGATE'
  | 'UI_TOGGLE'
  | 'SYSTEM_BOOT'
  | 'SYSTEM_READY'
  | 'QUEST_NEW'
  | 'QUEST_ACCEPT'
  | 'QUEST_START'
  | 'QUEST_COMPLETE'
  | 'QUEST_FAIL'
  | 'XP_GAIN'
  | 'LEVEL_UP'
  | 'REWARD'
  | 'STREAK'
  | 'STREAK_MILESTONE'
  | 'SECTOR_DISCOVERED'
  | 'WARNING'
  | 'BOSS_APPEAR'
  | 'BOSS_HIT'
  | 'BOSS_PHASE'
  | 'BOSS_DEFEATED';

export type MusicStateData = {
  currentState: MusicState;
  currentTrack: string | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
};

const MUSIC_TRACKS: Record<MusicState, { key: string; uri: string; loop?: boolean; volume?: number }> = {
  BOOT: { key: 'system_boot', uri: 'system_boot', loop: false, volume: 0.8 },
  HOME: { key: 'system_home', uri: 'dashboard_ambient', loop: true, volume: 0.4 },
  CHARACTER: { key: 'system_character', uri: 'dashboard_ambient', loop: true, volume: 0.35 },
  EXPLORE: { key: 'system_explore', uri: 'dashboard_ambient', loop: true, volume: 0.45 },
  QUEST: { key: 'system_quest', uri: 'dashboard_ambient', loop: true, volume: 0.4 },
  FIELD_QUEST: { key: 'system_field_quest', uri: 'dashboard_ambient', loop: true, volume: 0.4 },
  WARNING: { key: 'system_warning', uri: 'boss_theme', loop: true, volume: 0.5 },
  BOSS: { key: 'system_boss', uri: 'boss_theme', loop: true, volume: 0.6 },
  VICTORY: { key: 'system_victory', uri: 'level_up', loop: false, volume: 0.7 },
  SILENT: { key: 'silent', uri: '', loop: false, volume: 0 },
};

const SFX_EVENTS: Record<string, { uri: string; volume: number }> = {
  UI_CLICK: { uri: 'ui_click', volume: 0.5 },
  UI_CONFIRM: { uri: 'ui_confirm', volume: 0.6 },
  UI_CANCEL: { uri: 'ui_cancel', volume: 0.5 },
  UI_NAVIGATE: { uri: 'ui_navigate', volume: 0.4 },
  UI_TOGGLE: { uri: 'ui_toggle', volume: 0.4 },
  SYSTEM_BOOT: { uri: 'system_boot', volume: 0.7 },
  SYSTEM_READY: { uri: 'system_ready', volume: 0.6 },
  QUEST_NEW: { uri: 'quest_new', volume: 0.6 },
  QUEST_ACCEPT: { uri: 'quest_accept', volume: 0.6 },
  QUEST_START: { uri: 'quest_start', volume: 0.5 },
  QUEST_COMPLETE: { uri: 'quest_complete', volume: 0.7 },
  QUEST_FAIL: { uri: 'quest_fail', volume: 0.6 },
  XP_GAIN: { uri: 'xp_gain', volume: 0.5 },
  LEVEL_UP: { uri: 'level_up', volume: 0.8 },
  REWARD: { uri: 'reward', volume: 0.6 },
  STREAK: { uri: 'streak', volume: 0.5 },
  STREAK_MILESTONE: { uri: 'streak_milestone', volume: 0.7 },
  SECTOR_DISCOVERED: { uri: 'sector_discovered', volume: 0.6 },
  WARNING: { uri: 'warning', volume: 0.7 },
  BOSS_APPEAR: { uri: 'boss_appear', volume: 0.8 },
  BOSS_HIT: { uri: 'boss_hit', volume: 0.7 },
  BOSS_PHASE: { uri: 'boss_phase', volume: 0.7 },
  BOSS_DEFEATED: { uri: 'boss_defeated', volume: 0.8 },
};

const DEFAULT_VOLUMES = {
  master: 1.0,
  music: 0.5,
  sfx: 0.7,
};

const STORAGE_KEYS = {
  masterVolume: 'audio_master_volume',
  musicVolume: 'audio_music_volume',
  sfxVolume: 'audio_sfx_volume',
  masterMuted: 'audio_master_muted',
  musicMuted: 'audio_music_muted',
  sfxMuted: 'audio_sfx_muted',
  musicState: 'audio_music_state',
};

type AudioContextValue = {
  musicState: MusicState;
  setMusicState: (state: MusicState) => Promise<void>;
  getCurrentTrack: () => string | null;
  isMusicPlaying: boolean;
  setMusicVolume: (volume: number) => void;
  getMusicVolume: () => number;
  toggleMusicMute: () => void;
  isMusicMuted: () => boolean;
  playSFX: (event: SFXEvent) => Promise<void>;
  setSFXVolume: (volume: number) => void;
  getSFXVolume: () => number;
  toggleSFXMute: () => void;
  isSFXMuted: () => boolean;
  setMasterVolume: (volume: number) => void;
  getMasterVolume: () => number;
  toggleMasterMute: () => void;
  isMasterMuted: () => boolean;
  preloadTrack: (key: string) => Promise<void>;
  unloadTrack: (key: string) => void;
  isTrackLoaded: (key: string) => boolean;
  pauseAll: () => Promise<void>;
  resumeAll: () => Promise<void>;
  stopAll: () => Promise<void>;
};

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [musicState, setMusicStateState] = useState<MusicState>('SILENT');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolumeState] = useState(0.5);
  const [sfxVolume, setSFXVolumeState] = useState(0.7);
  const [masterVolume, setMasterVolumeState] = useState(1.0);
  const [musicMuted, setMusicMutedState] = useState(false);
  const [sfxMuted, setSFXMutedState] = useState(false);
  const [masterMuted, setMasterMutedState] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  
  const currentPlayerRef = useRef<AudioPlayer | null>(null);
  const sfxPoolRef = useRef<Map<string, AudioPlayer>>(new Map());
  const loadedTracksRef = useRef<Set<string>>(new Set());
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAppActiveRef = useRef(true);
  const isMusicPlayingRef = useRef(false);
  const pendingMusicStateRef = useRef<string | null>(null);

  // Load persisted settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [masterVol, musicVol, sfxVol, masterMuted, musicMuted, sfxMuted, savedState] = await Promise.all([
          SecureStore.getItemAsync('audio_master_volume'),
          SecureStore.getItemAsync('audio_music_volume'),
          SecureStore.getItemAsync('audio_sfx_volume'),
          SecureStore.getItemAsync('audio_master_muted'),
          SecureStore.getItemAsync('audio_music_muted'),
          SecureStore.getItemAsync('audio_sfx_muted'),
          SecureStore.getItemAsync('audio_music_state'),
        ]);
        
        if (masterVol !== null) setMasterVolumeState(parseFloat(masterVol));
        if (musicVol !== null) setMusicVolumeState(parseFloat(musicVol));
        if (sfxVol !== null) setSFXVolumeState(parseFloat(sfxVol));
        if (masterMuted !== null) setMasterMutedState(masterMuted === 'true');
        if (musicMuted !== null) setMusicMutedState(musicMuted === 'true');
        if (sfxMuted !== null) setSFXMutedState(sfxMuted === 'true');
        if (savedState && savedState !== 'SILENT') {
          // Don't auto-restore music state on boot - let the app decide
        }
      } catch {
        // Ignore storage errors
      }
    };
    loadSettings();
  }, []);

  // Persist settings
  const persistSetting = async (key: string, value: string | number | boolean) => {
    try {
      await SecureStore.setItemAsync(key, String(value));
    } catch {
      // Ignore
    }
  };

  // App state handling
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        pauseAll();
      } else if (state === 'active') {
        resumeAll();
      }
    });
    return () => subscription.remove();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const pauseAll = useCallback(async () => {
    if (currentPlayerRef.current) {
      currentPlayerRef.current.pause();
    }
    for (const [, player] of sfxPoolRef.current) {
      player.pause();
    }
    isMusicPlayingRef.current = false;
  }, []);

  const resumeAll = useCallback(async () => {
    if (currentPlayerRef.current && isMusicPlayingRef.current) {
      currentPlayerRef.current.play();
    }
  }, []);

  const stopAll = useCallback(async () => {
    if (currentPlayerRef.current) {
      currentPlayerRef.current.remove();
      currentPlayerRef.current = null;
    }
    for (const [, player] of sfxPoolRef.current) {
      player.remove();
    }
    sfxPoolRef.current.clear();
    isMusicPlayingRef.current = false;
  }, []);

  const setMusicState = useCallback(async (state: MusicState) => {
    pendingMusicStateRef.current = state;
    setMusicStateState(state);
    // Implementation would load and play the appropriate track
  }, []);

  const setMusicVolume = useCallback(async (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setMusicVolumeState(clamped);
    await persistSetting(STORAGE_KEYS.musicVolume, clamped);
    if (currentPlayerRef.current) {
      currentPlayerRef.current.volume = clamped * masterVolume * (musicMuted ? 0 : 1);
    }
  }, []);

  const getMusicVolume = useCallback(() => musicVolume, [musicVolume]);

  const toggleMusicMute = useCallback(async () => {
    const newMuted = !musicMuted;
    setMusicMutedState(newMuted);
    await persistSetting(STORAGE_KEYS.musicMuted, newMuted);
    if (currentPlayerRef.current) {
      currentPlayerRef.current.volume = newMuted ? 0 : musicVolume * masterVolume;
    }
  }, [musicMuted, musicVolume, masterVolume]);

  const isMusicMuted = useCallback(() => musicMuted, [musicMuted]);

  const playSFX = useCallback(async (event: SFXEvent) => {
    if (sfxMuted) return;
    const sfx = SFX_EVENTS[event];
    if (!sfx) return;
    
    let player = sfxPoolRef.current.get(sfx.uri);
    if (!player) {
      player = createAudioPlayer(sfx.uri);
      sfxPoolRef.current.set(sfx.uri, player);
    }
    player.volume = sfx.volume * sfxVolume * masterVolume;
    player.play();
  }, [sfxMuted, sfxVolume, masterVolume]);

  const setSFXVolume = useCallback(async (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setSFXVolumeState(clamped);
    await persistSetting(STORAGE_KEYS.sfxVolume, clamped);
  }, []);

  const getSFXVolume = useCallback(() => sfxVolume, [sfxVolume]);

  const toggleSFXMute = useCallback(async () => {
    const newMuted = !sfxMuted;
    setSFXMutedState(newMuted);
    await persistSetting(STORAGE_KEYS.sfxMuted, newMuted);
  }, [sfxMuted]);

  const isSFXMuted = useCallback(() => sfxMuted, [sfxMuted]);

  const setMasterVolume = useCallback(async (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setMasterVolumeState(clamped);
    await persistSetting(STORAGE_KEYS.masterVolume, clamped);
    if (currentPlayerRef.current) {
      currentPlayerRef.current.volume = clamped * musicVolume * (musicMuted ? 0 : 1);
    }
  }, [musicVolume, musicMuted]);

  const getMasterVolume = useCallback(() => masterVolume, [masterVolume]);

  const toggleMasterMute = useCallback(async () => {
    const newMuted = !masterMuted;
    setMasterMutedState(newMuted);
    await persistSetting(STORAGE_KEYS.masterMuted, newMuted);
    if (currentPlayerRef.current) {
      currentPlayerRef.current.volume = newMuted ? 0 : masterVolume * musicVolume * (musicMuted ? 0 : 1);
    }
  }, [masterMuted, masterVolume, musicVolume, musicMuted]);

  const isMasterMuted = useCallback(() => masterMuted, [masterMuted]);

  const preloadTrack = useCallback(async (key: string) => {
    if (loadedTracksRef.current.has(key)) return;
    const track = MUSIC_TRACKS[key as MusicState];
    if (!track) return;
    const player = createAudioPlayer(track.uri);
    // prepareAsync doesn't exist on AudioPlayer, loading happens automatically
    loadedTracksRef.current.add(key);
  }, []);

  const unloadTrack = useCallback((key: string) => {
    loadedTracksRef.current.delete(key);
  }, []);

  const isTrackLoaded = useCallback((key: string) => {
    return loadedTracksRef.current.has(key);
  }, []);

  const preloadTrackAsync = useCallback(async (key: string) => {
    await preloadTrack(key);
  }, [preloadTrack]);

  const unloadTrackAsync = useCallback((key: string) => {
    unloadTrack(key);
  }, [unloadTrack]);

  const isTrackLoadedAsync = useCallback((key: string) => {
    return isTrackLoaded(key);
  }, [isTrackLoaded]);

  const pauseAllAsync = useCallback(async () => {
    await pauseAll();
  }, [pauseAll]);

  const resumeAllAsync = useCallback(async () => {
    await resumeAll();
  }, [resumeAll]);

  const stopAllAsync = useCallback(async () => {
    await stopAll();
  }, [stopAll]);

  const value: AudioContextValue = {
    musicState,
    setMusicState,
    getCurrentTrack: () => currentTrack,
    isMusicPlaying,
    setMusicVolume,
    getMusicVolume,
    toggleMusicMute,
    isMusicMuted,
    playSFX,
    setSFXVolume,
    getSFXVolume,
    toggleSFXMute,
    isSFXMuted,
    setMasterVolume,
    getMasterVolume,
    toggleMasterMute,
    isMasterMuted,
    preloadTrack: preloadTrackAsync,
    unloadTrack: unloadTrackAsync,
    isTrackLoaded: isTrackLoadedAsync,
    pauseAll: pauseAllAsync,
    resumeAll: resumeAllAsync,
    stopAll: stopAllAsync,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
}

export function useMusic() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useMusic must be used within AudioProvider');
  return {
    musicState: context.musicState,
    setMusicState: context.setMusicState,
    getCurrentTrack: context.getCurrentTrack,
    isMusicPlaying: context.isMusicPlaying,
    setMusicVolume: context.setMusicVolume,
    getMusicVolume: context.getMusicVolume,
    toggleMusicMute: context.toggleMusicMute,
    isMusicMuted: context.isMusicMuted,
  };
}

export function useSFX() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useSFX must be used within AudioProvider');
  return {
    playSFX: context.playSFX,
    setSFXVolume: context.setSFXVolume,
    getSFXVolume: context.getSFXVolume,
    toggleSFXMute: context.toggleSFXMute,
    isSFXMuted: context.isSFXMuted,
  };
}

export function useMasterAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useMasterAudio must be used within AudioProvider');
  return {
    setMasterVolume: context.setMasterVolume,
    getMasterVolume: context.getMasterVolume,
    toggleMasterMute: context.toggleMasterMute,
    isMasterMuted: context.isMasterMuted,
  };
}

export function useMusicState() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useMusicState must be used within AudioProvider');
  return {
    musicState: context.musicState,
    setMusicState: context.setMusicState,
  };
}