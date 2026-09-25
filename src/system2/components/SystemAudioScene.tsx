import {useCallback} from 'react';
import {useFocusEffect} from 'expo-router';
import {playAudioTheme,stopAudioTheme} from '../identity/audio';
import {applyCinematicPreset,stopCinematicAudio,type CinematicPreset,type MusicCue} from '../audio/engine';


export default function SystemAudioScene({cue,preset}:{cue:MusicCue;preset?:CinematicPreset}){
  useFocusEffect(useCallback(()=>{
    playAudioTheme(cue);
    applyCinematicPreset(preset??(cue==='BOSS'?'BOSS':cue==='AWAKENING'?'AWAKENING':cue==='WORLD'?'WORLD':cue==='HOME'?'CITY':'RUINS'));
    return()=>{stopCinematicAudio();stopAudioTheme()};
  },[cue,preset]));
  return null;
}
