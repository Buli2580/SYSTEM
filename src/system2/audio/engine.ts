import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

export type AudioBus='music'|'ambient'|'sfx';
export type MusicCue='HOME'|'WORLD'|'QUEST'|'ACTIVE_QUEST'|'BOSS'|'VICTORY'|'AWAKENING';
export type SfxCue='UI_TAP'|'SCAN'|'QUEST_START'|'VERIFY'|'REWARD'|'LEVEL_UP'|'RANK_UP'|'PORTAL'|'BOSS_HIT'|'ERROR';

type Mix={enabled:boolean;music:number;ambient:number;sfx:number};
let mix:Mix={enabled:false,music:.8,ambient:.55,sfx:.9};
let musicPlayer:AudioPlayer|null=null;
let ambientPlayer:AudioPlayer|null=null;
let fxPlayer:AudioPlayer|null=null;
let currentMusic:MusicCue|null=null;

const musicSources:Partial<Record<MusicCue,any>>={
  HOME:require('../../../assets/audio/dashboard_ambient.mp3'),
  WORLD:require('../../../assets/audio/dashboard_ambient.mp3'),
  QUEST:require('../../../assets/audio/dashboard_ambient.mp3'),
  ACTIVE_QUEST:require('../../../assets/audio/dashboard_ambient.mp3'),
  BOSS:require('../../../assets/audio/boss_theme.mp3'),
  VICTORY:require('../../../assets/audio/quest_complete.mp3'),
  AWAKENING:require('../../../assets/audio/boss_theme.mp3'),
};
const sfxSources:Partial<Record<SfxCue,any>>={
  QUEST_START:require('../../../assets/audio/quest_start.wav'),
  REWARD:require('../../../assets/audio/quest_complete.mp3'),
  LEVEL_UP:require('../../../assets/audio/level_up.mp3'),
  ERROR:require('../../../assets/audio/quest_error.wav'),
};

function stopPlayer(player:AudioPlayer|null){try{player?.remove()}catch{}}
function spawn(source:any,volume:number,loop=false){
  const p=createAudioPlayer(source);
  p.volume=volume;
  p.loop=loop;
  p.play();
  return p;
}

export function configureAudioEngine(next:Partial<Mix>){
  mix={...mix,...next};
  if(!mix.enabled)stopAllAudio();
}
export function getAudioMix(){return{...mix}}
export function stopAllAudio(){
  stopPlayer(musicPlayer);stopPlayer(ambientPlayer);stopPlayer(fxPlayer);
  musicPlayer=ambientPlayer=fxPlayer=null;currentMusic=null;
}
export function playMusic(cue:MusicCue){
  if(!mix.enabled||mix.music<=0||currentMusic===cue)return;
  const source=musicSources[cue];if(!source)return;
  stopPlayer(musicPlayer);
  musicPlayer=spawn(source,mix.music,true);
  currentMusic=cue;
}
export function stopMusic(){stopPlayer(musicPlayer);musicPlayer=null;currentMusic=null}
export function playAmbient(source:any){
  if(!mix.enabled||mix.ambient<=0)return;
  stopPlayer(ambientPlayer);
  ambientPlayer=spawn(source,mix.ambient,true);
}
export function stopAmbient(){stopPlayer(ambientPlayer);ambientPlayer=null}
export function playSfx(cue:SfxCue){
  if(!mix.enabled||mix.sfx<=0)return;
  const source=sfxSources[cue];if(!source)return;
  stopPlayer(fxPlayer);
  fxPlayer=spawn(source,mix.sfx,false);
}
