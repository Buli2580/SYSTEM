import {useCallback} from 'react';
import {useFocusEffect} from 'expo-router';
import {playAudioTheme,stopAudioTheme} from '../identity/audio';
import type {MusicCue} from '../audio/engine';

export default function SystemAudioScene({cue}:{cue:MusicCue}){
  useFocusEffect(useCallback(()=>{
    playAudioTheme(cue);
    return()=>stopAudioTheme();
  },[cue]));
  return null;
}
