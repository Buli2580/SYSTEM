import type { RewardReceipt } from '../core/rewards';
import {
  configureAudioEngine,
  playMusic,
  playSfx,
  stopAllAudio,
  stopMusic,
  type MusicCue,
  type SfxCue,
} from '../audio/engine';

export type FeedbackEvent =
  | 'UI_TAP'
  | 'SCAN'
  | 'QUEST_START'
  | 'VERIFY'
  | 'QUEST_COMPLETE'
  | 'XP'
  | 'LEVEL_UP'
  | 'RANK_UP'
  | 'PORTAL'
  | 'BOSS_HIT'
  | 'ERROR';

type AudioConfig = {
  enabled:boolean;
  musicVolume?:number;
  ambientVolume?:number;
  sfxVolume?:number;
};

export function rewardSound(receipt: RewardReceipt): FeedbackEvent {
  const before=(receipt as RewardReceipt & {beforeRank?:string}).beforeRank;
  const after=(receipt as RewardReceipt & {afterRank?:string}).afterRank;
  if(before&&after&&before!==after)return'RANK_UP';
  return receipt.afterLevel > receipt.beforeLevel || receipt.skillLevels.length > 0 ? 'LEVEL_UP' : 'QUEST_COMPLETE';
}

export function configureAudio(value:boolean|AudioConfig){
  if(typeof value==='boolean') configureAudioEngine({enabled:value});
  else configureAudioEngine({
    enabled:value.enabled,
    music:value.musicVolume,
    ambient:value.ambientVolume,
    sfx:value.sfxVolume,
  });
}

export function playFeedback(event:FeedbackEvent){
  const map:Partial<Record<FeedbackEvent,SfxCue>>={
    UI_TAP:'UI_TAP',
    SCAN:'SCAN',
    QUEST_START:'QUEST_START',
    VERIFY:'VERIFY',
    QUEST_COMPLETE:'REWARD',
    XP:'REWARD',
    LEVEL_UP:'LEVEL_UP',
    RANK_UP:'RANK_UP',
    PORTAL:'PORTAL',
    BOSS_HIT:'BOSS_HIT',
    ERROR:'ERROR',
  };
  const cue=map[event];
  if(cue)playSfx(cue);
}

export function playAudioTheme(cue:MusicCue){playMusic(cue)}
export function stopAudioTheme(){stopMusic()}
export function stopAudio(){stopAllAudio()}
