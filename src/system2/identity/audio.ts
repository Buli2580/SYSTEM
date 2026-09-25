import type { RewardReceipt } from '../core/rewards';
export type FeedbackEvent = 'QUEST_START' | 'QUEST_COMPLETE' | 'LEVEL_UP' | 'ERROR';
export type MusicScene = 'HOME' | 'WORLD' | 'QUEST' | 'BOSS' | 'AWAKENING' | 'VICTORY';
export function rewardSound(receipt: RewardReceipt): FeedbackEvent {
 return receipt.afterLevel > receipt.beforeLevel || receipt.skillLevels.length > 0 ? 'LEVEL_UP' : 'QUEST_COMPLETE';
}
let enabled=false;
let player: import('expo-audio').AudioPlayer|null=null;
let music: import('expo-audio').AudioPlayer|null=null;
let cleanup: ReturnType<typeof setTimeout>|null=null;
let activeScene: MusicScene|null=null;
export function stopAudio(){if(cleanup)clearTimeout(cleanup);cleanup=null;try{player?.remove();}catch{} player=null;}
export function stopMusic(){try{music?.remove();}catch{} music=null;activeScene=null;}
export function configureAudio(value:boolean){enabled=value;if(!value){stopAudio();stopMusic();}}
function musicSource(scene:MusicScene){
 switch(scene){
  case 'WORLD': return require('../../../assets/audio/music/world.mp3');
  case 'QUEST': case 'BOSS': return require('../../../assets/audio/dashboard_ambient.mp3');
  case 'HOME': case 'AWAKENING': case 'VICTORY': default: return require('../../../assets/audio/music/home.wav');
 }
}
export function playSceneMusic(scene:MusicScene){
 if(!enabled||activeScene===scene)return;
 stopMusic();
 try{const {createAudioPlayer}=require('expo-audio') as typeof import('expo-audio');music=createAudioPlayer(musicSource(scene));music.loop=true;music.volume=scene==='BOSS'?.55:scene==='QUEST'?.42:.32;music.play();activeScene=scene;}catch{stopMusic();}
}
export function playFeedback(event:FeedbackEvent){
 if(!enabled||event==='QUEST_START'||event==='ERROR')return;
 stopAudio();
 try{const {createAudioPlayer}=require('expo-audio') as typeof import('expo-audio');const source=event==='LEVEL_UP'?require('../../../assets/audio/level_up.mp3'):require('../../../assets/audio/quest_complete.mp3');player=createAudioPlayer(source);player.play();cleanup=setTimeout(stopAudio,5000);}catch{stopAudio();}
}
