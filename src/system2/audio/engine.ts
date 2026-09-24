import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { LEGACY_AUDIO_FALLBACKS } from './manifest';

export type AudioBus='music'|'ambient'|'sfx';
export type MusicCue='HOME'|'WORLD'|'QUEST'|'ACTIVE_QUEST'|'BOSS'|'VICTORY'|'AWAKENING';
export type SfxCue='UI_TAP'|'SCAN'|'QUEST_START'|'VERIFY'|'REWARD'|'XP'|'LEVEL_UP'|'RANK_UP'|'PORTAL'|'BOSS_HIT'|'ERROR';
export type CinematicLayer='CITY_RUINS'|'FIRE'|'WIND'|'RAIN'|'STORM'|'PORTAL_ENERGY';
export type CinematicEvent='OGRE_STEP'|'OGRE_ROAR'|'BUILDING_HIT'|'DEBRIS'|'THUNDER'|'PORTAL_ENERGY'|'BASS_IMPACT'|'BOSS_ENTER'|'BOSS_ATTACK'|'BOSS_HIT'|'BOSS_PHASE_2'|'BOSS_ENRAGE'|'BOSS_DEATH'|'VICTORY'|'AWAKENING_ENTER'|'AWAKENING_RISE'|'AWAKENING_FLASH'|'AWAKENING_COMPLETE';

type Mix={enabled:boolean;music:number;ambient:number;sfx:number};
let mix:Mix={enabled:false,music:.8,ambient:.55,sfx:.9};
let musicPlayer:AudioPlayer|null=null;
let ambientPlayer:AudioPlayer|null=null;
let fxPlayer:AudioPlayer|null=null;
const cinematicPlayers=new Map<CinematicLayer,AudioPlayer>();
const cinematicEventPlayers=new Set<AudioPlayer>();
const cinematicLayerBaseVolume=new Map<CinematicLayer,number>();
let musicDuckTimer:ReturnType<typeof setTimeout>|null=null;
let activePreset:CinematicPreset|null=null;
let currentMusic:MusicCue|null=null;
const fades=new Map<AudioPlayer,ReturnType<typeof setInterval>>();

const musicSources:Partial<Record<MusicCue,any>>=LEGACY_AUDIO_FALLBACKS.music;
const sfxSources:Partial<Record<SfxCue,any>>=LEGACY_AUDIO_FALLBACKS.sfx;
const cinematicSources=LEGACY_AUDIO_FALLBACKS.cinematic;

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
    for(const [layer,player] of cinematicPlayers){const base=cinematicLayerBaseVolume.get(layer)??.35;try{player.volume=Math.min(1,base*mix.ambient)}catch{} }
  }
}
export function getAudioMix(){return{...mix}}
export function stopCinematicAudio(){
  activePreset=null;
  for(const player of cinematicPlayers.values())stopPlayer(player);
  cinematicPlayers.clear();
  cinematicLayerBaseVolume.clear();
  for(const player of cinematicEventPlayers)stopPlayer(player);
  cinematicEventPlayers.clear();
}
export function stopAllAudio(){
  if(musicDuckTimer){clearTimeout(musicDuckTimer);musicDuckTimer=null}
  clearFade();
  stopPlayer(musicPlayer);stopPlayer(ambientPlayer);stopPlayer(fxPlayer);stopCinematicAudio();
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
export function stopMusic(){if(musicDuckTimer){clearTimeout(musicDuckTimer);musicDuckTimer=null}fadeOutAndRemove(musicPlayer,280);musicPlayer=null;currentMusic=null}
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

export function setCinematicLayer(layer:CinematicLayer,source:any,volume=.35){
  if(!mix.enabled||mix.ambient<=0||!source)return;
  const previous=cinematicPlayers.get(layer);
  if(previous){cinematicLayerBaseVolume.set(layer,volume);try{previous.volume=Math.min(1,volume*mix.ambient)}catch{}return;}
  cinematicLayerBaseVolume.set(layer,volume);
  const player=spawn(source,0,true);
  cinematicPlayers.set(layer,player);
  fadeIn(player,Math.min(1,volume*mix.ambient),650);
}
export function clearCinematicLayer(layer:CinematicLayer){
  const player=cinematicPlayers.get(layer);if(!player)return;
  cinematicPlayers.delete(layer);cinematicLayerBaseVolume.delete(layer);fadeOutAndRemove(player,350);
}
function duckMusic(duration=650,depth=.46){
  if(!musicPlayer)return;
  if(musicDuckTimer)clearTimeout(musicDuckTimer);
  try{musicPlayer.volume=Math.max(.08,mix.music*depth)}catch{}
  musicDuckTimer=setTimeout(()=>{if(musicPlayer){try{musicPlayer.volume=mix.music}catch{}}musicDuckTimer=null},duration);
}
export function playCinematicEvent(_event:CinematicEvent,source:any,volume=1){
  if(!mix.enabled||mix.sfx<=0||!source)return;
  if(['OGRE_ROAR','BUILDING_HIT','THUNDER','PORTAL_ENERGY','BASS_IMPACT','BOSS_ENTER','BOSS_ATTACK','BOSS_PHASE_2','BOSS_ENRAGE','BOSS_DEATH','VICTORY','AWAKENING_ENTER','AWAKENING_RISE','AWAKENING_FLASH','AWAKENING_COMPLETE'].includes(_event))duckMusic(_event==='OGRE_ROAR'?1100:_event==='AWAKENING_ENTER'?1250:700,_event==='BASS_IMPACT'?.34:_event==='THUNDER'?.40:.48);
  const player=spawn(source,Math.min(1,volume*mix.sfx),false);
  cinematicEventPlayers.add(player);
  setTimeout(()=>{cinematicEventPlayers.delete(player);stopPlayer(player)},12000);
}

export type CinematicPreset='CITY'|'FOREST'|'INDUSTRIAL'|'RUINS'|'WORLD'|'PORTAL'|'BOSS'|'AWAKENING';
export function applyCinematicPreset(preset:CinematicPreset){
  if(activePreset===preset)return;
  stopCinematicAudio();
  activePreset=preset;
  const layers:CinematicLayer[]=preset==='BOSS'?['CITY_RUINS','FIRE','WIND','STORM']:preset==='AWAKENING'||preset==='PORTAL'?['WIND','PORTAL_ENERGY']:preset==='WORLD'?['WIND','RAIN']:preset==='FOREST'?['WIND','RAIN']:preset==='INDUSTRIAL'?['CITY_RUINS','WIND']:preset==='RUINS'?['CITY_RUINS','FIRE','WIND']:['CITY_RUINS','WIND'];
  for(const layer of layers){const asset=cinematicSources.layers[layer];if(asset)setCinematicLayer(layer,asset.source,asset.volume)}
  const event=preset==='BOSS'?'BOSS_ENTER':preset==='AWAKENING'?'AWAKENING_ENTER':null;
  if(event){const asset=cinematicSources.events[event];playCinematicEvent(event,asset.source,asset.volume)}
}
export function triggerCinematicEvent(event:CinematicEvent){
  const asset=cinematicSources.events[event];if(asset)playCinematicEvent(event,asset.source,asset.volume);
}

export type BossCinematicState='ENTER'|'ROAR'|'ATTACK'|'HIT'|'PHASE_2'|'ENRAGE'|'DEATH'|'VICTORY';
export function triggerBossCinematicState(state:BossCinematicState){
  const map:Record<BossCinematicState,CinematicEvent>={
    ENTER:'BOSS_ENTER',ROAR:'OGRE_ROAR',ATTACK:'BOSS_ATTACK',HIT:'BOSS_HIT',
    PHASE_2:'BOSS_PHASE_2',ENRAGE:'BOSS_ENRAGE',DEATH:'BOSS_DEATH',VICTORY:'VICTORY',
  };
  triggerCinematicEvent(map[state]);
}
export type AwakeningCinematicState='CALM'|'PORTAL'|'RUNES'|'ENERGY'|'WIND'|'PUSH'|'FLASH'|'DROP'|'AWAKENED';
export function triggerAwakeningCinematicState(state:AwakeningCinematicState){
  const map:Partial<Record<AwakeningCinematicState,CinematicEvent>>={
    PORTAL:'PORTAL_ENERGY',ENERGY:'AWAKENING_RISE',WIND:'AWAKENING_RISE',
    FLASH:'AWAKENING_FLASH',DROP:'BASS_IMPACT',AWAKENED:'AWAKENING_COMPLETE',
  };
  const event=map[state];if(event)triggerCinematicEvent(event);
}
