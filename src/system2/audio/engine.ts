import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { LEGACY_AUDIO_FALLBACKS } from './manifest';

export type AudioBus='music'|'ambient'|'sfx';
export type MusicCue='HOME'|'WORLD'|'QUEST'|'ACTIVE_QUEST'|'BOSS'|'VICTORY'|'AWAKENING';
export type SfxCue='UI_TAP'|'SCAN'|'QUEST_START'|'VERIFY'|'REWARD'|'LEVEL_UP'|'RANK_UP'|'PORTAL'|'BOSS_HIT'|'ERROR';

type Mix={enabled:boolean;music:number;ambient:number;sfx:number};
let mix:Mix={enabled:false,music:.8,ambient:.55,sfx:.9};
let musicPlayer:AudioPlayer|null=null;
let ambientPlayer:AudioPlayer|null=null;
let fxPlayer:AudioPlayer|null=null;
let currentMusic:MusicCue|null=null;
const fades=new Map<AudioPlayer,ReturnType<typeof setInterval>>();

const musicSources:Partial<Record<MusicCue,any>>=LEGACY_AUDIO_FALLBACKS.music;
const sfxSources:Partial<Record<SfxCue,any>>=LEGACY_AUDIO_FALLBACKS.sfx;

function stopPlayer(player:AudioPlayer|null){if(!player)return;clearFade(player);try{player.remove()}catch{}}
function spawn(source:any,volume:number,loop=false){
  const p=createAudioPlayer(source);
  p.volume=Math.max(0,Math.min(1,volume));
  p.loop=loop;
  p.play();
  return p;
}
function clearFade(player?:AudioPlayer){
  if(player){const timer=fades.get(player);if(timer)clearInterval(timer);fades.delete(player);return}
  for(const timer of fades.values())clearInterval(timer);
  fades.clear();
}
function fadeOutAndRemove(player:AudioPlayer|null,duration=450){
  if(!player)return;
  clearFade(player);
  const start=Number(player.volume||0);
  const steps=9;
  let i=0;
  const timer=setInterval(()=>{
    i+=1;
    try{player.volume=Math.max(0,start*(1-i/steps))}catch{}
    if(i>=steps)stopPlayer(player);
  },Math.max(20,Math.round(duration/steps)));
  fades.set(player,timer);
}
function fadeIn(player:AudioPlayer,target:number,duration=550){
  clearFade(player);
  const steps=11;
  let i=0;
  try{player.volume=0}catch{}
  const timer=setInterval(()=>{
    i+=1;
    try{player.volume=Math.min(target,target*(i/steps))}catch{}
    if(i>=steps)clearFade(player);
  },Math.max(20,Math.round(duration/steps)));
  fades.set(player,timer);
}

export function configureAudioEngine(next:Partial<Mix>){
  mix={...mix,...next};
  if(!mix.enabled)stopAllAudio();
  else {
    if(musicPlayer) musicPlayer.volume=mix.music;
    if(ambientPlayer) ambientPlayer.volume=mix.ambient;
    if(fxPlayer) fxPlayer.volume=mix.sfx;
  }
}
export function getAudioMix(){return{...mix}}
export function stopAllAudio(){
  clearFade();
  stopPlayer(musicPlayer);stopPlayer(ambientPlayer);stopPlayer(fxPlayer);
  musicPlayer=ambientPlayer=fxPlayer=null;currentMusic=null;
}
export function playMusic(cue:MusicCue){
  if(!mix.enabled||mix.music<=0||currentMusic===cue)return;
  const asset=musicSources[cue];if(!asset?.source)return;
  const previous=musicPlayer;
  const next=spawn(asset.source,0,asset.loop);
  musicPlayer=next;
  currentMusic=cue;
  fadeIn(next,mix.music,cue==='VICTORY'||cue==='AWAKENING'?280:600);
  fadeOutAndRemove(previous,cue==='BOSS'?300:520);
}
export function stopMusic(){fadeOutAndRemove(musicPlayer,280);musicPlayer=null;currentMusic=null}
export function playAmbient(source:any){
  if(!mix.enabled||mix.ambient<=0)return;
  const previous=ambientPlayer;
  ambientPlayer=spawn(source,0,true);
  fadeIn(ambientPlayer,mix.ambient,700);
  fadeOutAndRemove(previous,500);
}
export function stopAmbient(){fadeOutAndRemove(ambientPlayer,300);ambientPlayer=null}
export function playSfx(cue:SfxCue){
  if(!mix.enabled||mix.sfx<=0)return;
  const asset=sfxSources[cue];if(!asset?.source)return;
  stopPlayer(fxPlayer);
  fxPlayer=spawn(asset.source,mix.sfx,false);
}

export function audioAssetStatus(){
  return {
    music:Object.fromEntries(Object.entries(LEGACY_AUDIO_FALLBACKS.music).map(([k,v])=>[k,{placeholder:v.placeholder,replacement:v.recommendedReplacement}])),
    sfx:Object.fromEntries(Object.entries(LEGACY_AUDIO_FALLBACKS.sfx).map(([k,v])=>[k,{placeholder:v.placeholder,replacement:v.recommendedReplacement}])),
  };
}
