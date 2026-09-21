import type { RewardReceipt } from '../core/rewards';
export type FeedbackEvent = 'QUEST_START' | 'QUEST_COMPLETE' | 'LEVEL_UP' | 'ERROR';
export function rewardSound(receipt: RewardReceipt): FeedbackEvent {
 return receipt.afterLevel > receipt.beforeLevel || receipt.skillLevels.length > 0 ? 'LEVEL_UP' : 'QUEST_COMPLETE';
}
let enabled = false;
let player: import('expo-audio').AudioPlayer | null = null;
let cleanup: ReturnType<typeof setTimeout> | null = null;
export function stopAudio() {
 if (cleanup) clearTimeout(cleanup); cleanup = null;
 try { player?.remove(); } catch { /* optional native effect */ } player = null;
}
export function configureAudio(value: boolean) { enabled = value; if (!value) stopAudio(); }
export function playFeedback(event: FeedbackEvent) {
 if (!enabled) return;
 stopAudio();
 try {
   const { createAudioPlayer } = require('expo-audio') as typeof import('expo-audio');
   const source = event === 'LEVEL_UP' ? require('../../../assets/audio/level_up.mp3')
     : event === 'QUEST_COMPLETE' ? require('../../../assets/audio/quest_complete.mp3')
     : event === 'QUEST_START' ? require('../../../assets/audio/quest_start.wav')
     : require('../../../assets/audio/quest_error.wav');
   player = createAudioPlayer(source); player.play();
   cleanup = setTimeout(stopAudio, event === 'LEVEL_UP' || event === 'QUEST_COMPLETE' ? 5000 : 1200);
 } catch { stopAudio(); }
}
