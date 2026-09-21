import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
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

type AudioSource = Parameters<typeof createAudioPlayer>[0];

const AUDIO = {
  ambient: require('../../../assets/audio/dashboard_ambient.mp3') as AudioSource,
  boss: require('../../../assets/audio/boss_theme.mp3') as AudioSource,
  levelUp: require('../../../assets/audio/level_up.mp3') as AudioSource,
  questComplete: require('../../../assets/audio/quest_complete.mp3') as AudioSource,
};

type MusicTrack = {
  key: string;
  source: AudioSource | null;
  loop: boolean;
  gain: number;
};

const MUSIC_TRACKS: Record<MusicState, MusicTrack> = {
  BOOT: { key: 'boot_ambient', source: AUDIO.ambient, loop: true, gain: 0.28 },
  HOME: { key: 'home_ambient', source: AUDIO.ambient, loop: true, gain: 0.38 },
  CHARACTER: { key: 'character_ambient', source: AUDIO.ambient, loop: true, gain: 0.32 },
  EXPLORE: { key: 'explore_ambient', source: AUDIO.ambient, loop: true, gain: 0.42 },
  QUEST: { key: 'quest_ambient', source: AUDIO.ambient, loop: true, gain: 0.34 },
  FIELD_QUEST: { key: 'field_quest_ambient', source: AUDIO.ambient, loop: true, gain: 0.34 },
  WARNING: { key: 'warning_theme', source: AUDIO.boss, loop: true, gain: 0.40 },
  BOSS: { key: 'boss_theme', source: AUDIO.boss, loop: true, gain: 0.58 },
  VICTORY: { key: 'victory_sting', source: AUDIO.levelUp, loop: false, gain: 0.75 },
  SILENT: { key: 'silent', source: null, loop: false, gain: 0 },
};

type SFXDefinition = { source: AudioSource; gain: number } | null;

// Only map events to assets that actually exist in the repository.
// Missing sounds intentionally stay silent until a dedicated asset is added.
const SFX_EVENTS: Record<SFXEvent, SFXDefinition> = {
  UI_CLICK: null,
  UI_CONFIRM: null,
  UI_CANCEL: null,
  UI_NAVIGATE: null,
  UI_TOGGLE: null,
  SYSTEM_BOOT: null,
  SYSTEM_READY: null,
  QUEST_NEW: null,
  QUEST_ACCEPT: null,
  QUEST_START: null,
  QUEST_COMPLETE: { source: AUDIO.questComplete, gain: 0.82 },
  QUEST_FAIL: null,
  XP_GAIN: null,
  LEVEL_UP: { source: AUDIO.levelUp, gain: 0.95 },
  REWARD: null,
  STREAK: null,
  STREAK_MILESTONE: { source: AUDIO.levelUp, gain: 0.58 },
  SECTOR_DISCOVERED: null,
  WARNING: null,
  BOSS_APPEAR: null,
  BOSS_HIT: null,
  BOSS_PHASE: null,
  BOSS_DEFEATED: { source: AUDIO.levelUp, gain: 0.86 },
};

const STORAGE_KEYS = {
  masterVolume: 'audio_master_volume',
  musicVolume: 'audio_music_volume',
  sfxVolume: 'audio_sfx_volume',
  masterMuted: 'audio_master_muted',
  musicMuted: 'audio_music_muted',
  sfxMuted: 'audio_sfx_muted',
} as const;

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
  pauseAll: () => Promise<void>;
  resumeAll: () => Promise<void>;
  stopAll: () => Promise<void>;
};

const AudioContext = createContext<AudioContextValue | null>(null);

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function safeRemove(player: AudioPlayer | null) {
  if (!player) return;
  try { player.remove(); } catch { /* Native player may already be released. */ }
}

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [musicState, setMusicStateValue] = useState<MusicState>('SILENT');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolumeValue] = useState(0.5);
  const [sfxVolume, setSFXVolumeValue] = useState(0.7);
  const [masterVolume, setMasterVolumeValue] = useState(1);
  const [musicMuted, setMusicMutedValue] = useState(false);
  const [sfxMuted, setSFXMutedValue] = useState(false);
  const [masterMuted, setMasterMutedValue] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);

  const musicPlayerRef = useRef<AudioPlayer | null>(null);
  const musicStateRef = useRef<MusicState>('SILENT');
  const shouldResumeRef = useRef(false);
  const transitionRef = useRef(0);
  const activeSfxRef = useRef(new Set<AudioPlayer>());
  const lastSfxRef = useRef<{ event: SFXEvent; at: number } | null>(null);

  const masterVolumeRef = useRef(masterVolume);
  const musicVolumeRef = useRef(musicVolume);
  const sfxVolumeRef = useRef(sfxVolume);
  const masterMutedRef = useRef(masterMuted);
  const musicMutedRef = useRef(musicMuted);
  const sfxMutedRef = useRef(sfxMuted);

  useEffect(() => { masterVolumeRef.current = masterVolume; }, [masterVolume]);
  useEffect(() => { musicVolumeRef.current = musicVolume; }, [musicVolume]);
  useEffect(() => { sfxVolumeRef.current = sfxVolume; }, [sfxVolume]);
  useEffect(() => { masterMutedRef.current = masterMuted; }, [masterMuted]);
  useEffect(() => { musicMutedRef.current = musicMuted; }, [musicMuted]);
  useEffect(() => { sfxMutedRef.current = sfxMuted; }, [sfxMuted]);

  const persist = useCallback(async (key: string, value: string | number | boolean) => {
    try { await SecureStore.setItemAsync(key, String(value)); } catch { /* Optional preference persistence. */ }
  }, []);

  const musicGain = useCallback((track: MusicTrack) => {
    if (masterMutedRef.current || musicMutedRef.current) return 0;
    return clamp01(track.gain * masterVolumeRef.current * musicVolumeRef.current);
  }, []);

  const applyMusicVolume = useCallback(() => {
    const player = musicPlayerRef.current;
    if (!player) return;
    player.volume = musicGain(MUSIC_TRACKS[musicStateRef.current]);
  }, [musicGain]);

  useEffect(() => {
    void (async () => {
      try {
        const [master, music, sfx, masterMute, musicMute, sfxMute] = await Promise.all([
          SecureStore.getItemAsync(STORAGE_KEYS.masterVolume),
          SecureStore.getItemAsync(STORAGE_KEYS.musicVolume),
          SecureStore.getItemAsync(STORAGE_KEYS.sfxVolume),
          SecureStore.getItemAsync(STORAGE_KEYS.masterMuted),
          SecureStore.getItemAsync(STORAGE_KEYS.musicMuted),
          SecureStore.getItemAsync(STORAGE_KEYS.sfxMuted),
        ]);
        if (master !== null) setMasterVolumeValue(clamp01(Number(master)));
        if (music !== null) setMusicVolumeValue(clamp01(Number(music)));
        if (sfx !== null) setSFXVolumeValue(clamp01(Number(sfx)));
        if (masterMute !== null) setMasterMutedValue(masterMute === 'true');
        if (musicMute !== null) setMusicMutedValue(musicMute === 'true');
        if (sfxMute !== null) setSFXMutedValue(sfxMute === 'true');
      } catch {
        // Audio preferences are non-critical.
      }
    })();
  }, []);

  const stopAll = useCallback(async () => {
    transitionRef.current += 1;
    shouldResumeRef.current = false;
    safeRemove(musicPlayerRef.current);
    musicPlayerRef.current = null;
    for (const player of activeSfxRef.current) safeRemove(player);
    activeSfxRef.current.clear();
    setCurrentTrack(null);
    setIsMusicPlaying(false);
  }, []);

  const pauseAll = useCallback(async () => {
    shouldResumeRef.current = Boolean(musicPlayerRef.current && isMusicPlaying);
    try { musicPlayerRef.current?.pause(); } catch { /* noop */ }
    for (const player of activeSfxRef.current) {
      try { player.pause(); } catch { /* noop */ }
    }
    setIsMusicPlaying(false);
  }, [isMusicPlaying]);

  const resumeAll = useCallback(async () => {
    if (!shouldResumeRef.current || !musicPlayerRef.current) return;
    try {
      musicPlayerRef.current.play();
      setIsMusicPlaying(true);
    } catch {
      setIsMusicPlaying(false);
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void resumeAll();
      else void pauseAll();
    });
    return () => subscription.remove();
  }, [pauseAll, resumeAll]);

  useEffect(() => () => { void stopAll(); }, [stopAll]);

  const fadeOutCurrent = useCallback(async (token: number) => {
    const player = musicPlayerRef.current;
    if (!player) return;
    const start = player.volume;
    for (let step = 5; step >= 0; step -= 1) {
      if (transitionRef.current !== token) return;
      player.volume = start * (step / 5);
      await wait(28);
    }
    if (transitionRef.current !== token) return;
    safeRemove(player);
    if (musicPlayerRef.current === player) musicPlayerRef.current = null;
  }, []);

  const setMusicState = useCallback(async (state: MusicState) => {
    const track = MUSIC_TRACKS[state];
    const token = ++transitionRef.current;
    musicStateRef.current = state;
    setMusicStateValue(state);

    if (!track.source) {
      await fadeOutCurrent(token);
      if (transitionRef.current === token) {
        setCurrentTrack(null);
        setIsMusicPlaying(false);
      }
      return;
    }

    const current = musicPlayerRef.current;
    if (current && currentTrack === track.key) {
      current.loop = track.loop;
      current.volume = musicGain(track);
      return;
    }

    await fadeOutCurrent(token);
    if (transitionRef.current !== token) return;

    try {
      const player = createAudioPlayer(track.source);
      player.loop = track.loop;
      player.volume = 0;
      musicPlayerRef.current = player;
      setCurrentTrack(track.key);
      player.play();
      shouldResumeRef.current = true;
      setIsMusicPlaying(true);

      const target = musicGain(track);
      for (let step = 1; step <= 8; step += 1) {
        if (transitionRef.current !== token || musicPlayerRef.current !== player) {
          safeRemove(player);
          return;
        }
        player.volume = target * (step / 8);
        await wait(35);
      }
    } catch {
      if (transitionRef.current === token) {
        musicPlayerRef.current = null;
        setCurrentTrack(null);
        setIsMusicPlaying(false);
      }
    }
  }, [currentTrack, fadeOutCurrent, musicGain]);

  const playSFX = useCallback(async (event: SFXEvent) => {
    if (masterMutedRef.current || sfxMutedRef.current) return;
    const now = Date.now();
    const last = lastSfxRef.current;
    if (last?.event === event && now - last.at < 250) return;
    lastSfxRef.current = { event, at: now };
    const definition = SFX_EVENTS[event];
    if (!definition) return;
    try {
      const player = createAudioPlayer(definition.source);
      activeSfxRef.current.add(player);
      player.volume = clamp01(definition.gain * masterVolumeRef.current * sfxVolumeRef.current);
      player.play();
      setTimeout(() => {
        activeSfxRef.current.delete(player);
        safeRemove(player);
      }, 7000);
    } catch {
      // A presentation sound must never break gameplay.
    }
  }, []);

  const setMusicVolume = useCallback((value: number) => {
    const volume = clamp01(value);
    setMusicVolumeValue(volume);
    musicVolumeRef.current = volume;
    void persist(STORAGE_KEYS.musicVolume, volume);
    applyMusicVolume();
  }, [applyMusicVolume, persist]);

  const setSFXVolume = useCallback((value: number) => {
    const volume = clamp01(value);
    setSFXVolumeValue(volume);
    sfxVolumeRef.current = volume;
    void persist(STORAGE_KEYS.sfxVolume, volume);
  }, [persist]);

  const setMasterVolume = useCallback((value: number) => {
    const volume = clamp01(value);
    setMasterVolumeValue(volume);
    masterVolumeRef.current = volume;
    void persist(STORAGE_KEYS.masterVolume, volume);
    applyMusicVolume();
  }, [applyMusicVolume, persist]);

  const toggleMusicMute = useCallback(() => {
    const value = !musicMutedRef.current;
    musicMutedRef.current = value;
    setMusicMutedValue(value);
    void persist(STORAGE_KEYS.musicMuted, value);
    applyMusicVolume();
  }, [applyMusicVolume, persist]);

  const toggleSFXMute = useCallback(() => {
    const value = !sfxMutedRef.current;
    sfxMutedRef.current = value;
    setSFXMutedValue(value);
    void persist(STORAGE_KEYS.sfxMuted, value);
  }, [persist]);

  const toggleMasterMute = useCallback(() => {
    const value = !masterMutedRef.current;
    masterMutedRef.current = value;
    setMasterMutedValue(value);
    void persist(STORAGE_KEYS.masterMuted, value);
    applyMusicVolume();
  }, [applyMusicVolume, persist]);

  const value: AudioContextValue = {
    musicState,
    setMusicState,
    getCurrentTrack: () => currentTrack,
    isMusicPlaying,
    setMusicVolume,
    getMusicVolume: () => musicVolume,
    toggleMusicMute,
    isMusicMuted: () => musicMuted,
    playSFX,
    setSFXVolume,
    getSFXVolume: () => sfxVolume,
    toggleSFXMute,
    isSFXMuted: () => sfxMuted,
    setMasterVolume,
    getMasterVolume: () => masterVolume,
    toggleMasterMute,
    isMasterMuted: () => masterMuted,
    pauseAll,
    resumeAll,
    stopAll,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
}

export function useMusic() {
  const { musicState, setMusicState, getCurrentTrack, isMusicPlaying, setMusicVolume, getMusicVolume, toggleMusicMute, isMusicMuted } = useAudio();
  return { musicState, setMusicState, getCurrentTrack, isMusicPlaying, setMusicVolume, getMusicVolume, toggleMusicMute, isMusicMuted };
}

export function useSFX() {
  const { playSFX, setSFXVolume, getSFXVolume, toggleSFXMute, isSFXMuted } = useAudio();
  return { playSFX, setSFXVolume, getSFXVolume, toggleSFXMute, isSFXMuted };
}

export function useMasterAudio() {
  const { setMasterVolume, getMasterVolume, toggleMasterMute, isMasterMuted } = useAudio();
  return { setMasterVolume, getMasterVolume, toggleMasterMute, isMasterMuted };
}
