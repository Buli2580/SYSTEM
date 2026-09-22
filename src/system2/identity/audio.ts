import type { RewardReceipt } from '../core/rewards';

export type FeedbackEvent =
  | 'UI_TAP'
  | 'SYSTEM_WAKE'
  | 'QUEST_START'
  | 'VERIFY'
  | 'QUEST_COMPLETE'
  | 'XP'
  | 'LEVEL_UP'
  | 'ERROR';

export type MusicTrack = 'DASHBOARD' | 'QUEST' | 'BOSS';

let enabled = true;
let sfxVolume = 0.8;
let musicVolume = 0.35;
let effectPlayer: import('expo-audio').AudioPlayer | null = null;
let musicPlayer: import('expo-audio').AudioPlayer | null = null;
let effectCleanup: ReturnType<typeof setTimeout> | null = null;
let activeTrack: MusicTrack | null = null;

const sources = {
  UI_TAP: require('../../../assets/audio/ui_tap.wav'),
  SYSTEM_WAKE: require('../../../assets/audio/system_wake.wav'),
  QUEST_START: require('../../../assets/audio/quest_start.wav'),
  VERIFY: require('../../../assets/audio/verify.wav'),
  QUEST_COMPLETE: require('../../../assets/audio/quest_complete.mp3'),
  XP: require('../../../assets/audio/xp_gain.wav'),
  LEVEL_UP: require('../../../assets/audio/level_up.mp3'),
  ERROR: require('../../../assets/audio/error.wav'),
} as const;

const musicSources = {
  DASHBOARD: require('../../../assets/audio/dashboard_ambient.mp3'),
  QUEST: require('../../../assets/audio/dashboard_ambient.mp3'),
  BOSS: require('../../../assets/audio/boss_theme.mp3'),
} as const;

export function rewardSound(receipt: RewardReceipt): FeedbackEvent {
  return receipt.afterLevel > receipt.beforeLevel || receipt.skillLevels.length > 0 ? 'LEVEL_UP' : 'XP';
}

export function configureAudio(value: boolean | { enabled: boolean; sfxVolume?: number; musicVolume?: number }) {
  if (typeof value === 'boolean') enabled = value;
  else {
    enabled = value.enabled;
    if (typeof value.sfxVolume === 'number') sfxVolume = clamp(value.sfxVolume);
    if (typeof value.musicVolume === 'number') musicVolume = clamp(value.musicVolume);
  }
  if (!enabled) {
    stopAudio();
    stopMusic();
  } else if (musicPlayer) {
    musicPlayer.volume = musicVolume;
  }
}

export function playFeedback(event: FeedbackEvent) {
  if (!enabled || sfxVolume <= 0) return;
  stopEffect();
  try {
    const { createAudioPlayer } = require('expo-audio') as typeof import('expo-audio');
    effectPlayer = createAudioPlayer(sources[event]);
    effectPlayer.volume = sfxVolume;
    effectPlayer.play();
    effectCleanup = setTimeout(stopEffect, event === 'SYSTEM_WAKE' ? 2500 : 5000);
  } catch {
    stopEffect();
  }
}

export function playMusic(track: MusicTrack) {
  if (!enabled || musicVolume <= 0) return;
  if (activeTrack === track && musicPlayer) {
    musicPlayer.volume = musicVolume;
    return;
  }
  stopMusic();
  try {
    const { createAudioPlayer } = require('expo-audio') as typeof import('expo-audio');
    musicPlayer = createAudioPlayer(musicSources[track]);
    musicPlayer.loop = true;
    musicPlayer.volume = track === 'QUEST' ? musicVolume * 0.55 : musicVolume;
    activeTrack = track;
    musicPlayer.play();
  } catch {
    stopMusic();
  }
}

export function stopMusic() {
  activeTrack = null;
  try { musicPlayer?.remove(); } catch { /* optional native audio */ }
  musicPlayer = null;
}

export function stopAudio() {
  stopEffect();
  stopMusic();
}

function stopEffect() {
  if (effectCleanup) clearTimeout(effectCleanup);
  effectCleanup = null;
  try { effectPlayer?.remove(); } catch { /* optional native audio */ }
  effectPlayer = null;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}
