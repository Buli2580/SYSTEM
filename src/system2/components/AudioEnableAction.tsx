import {useState} from 'react';
import {Text,View} from 'react-native';
import {useSystem} from '../state/SystemProvider';
import {configureAudio,playAudioTheme,playFeedback} from '../identity/audio';
import type {MusicCue} from '../audio/engine';
import Action from './Action';

// Reachable before the first quest for beta profiles created while audio defaulted OFF.
// Do not override an existing player's saved preference silently.
export default function AudioEnableAction({cue='AWAKENING'}:{cue?:MusicCue}){
  const {settings,saveSettings}=useSystem();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  if(!settings||settings.audio)return null;

  const enable=async()=>{
    if(busy)return;
    setBusy(true);
    setError('');
    try{
      await saveSettings({audio:true});
      configureAudio({
        enabled:true,
        musicVolume:settings.musicVolume,
        ambientVolume:settings.ambientVolume,
        sfxVolume:settings.sfxVolume,
      });
      playAudioTheme(cue);
      playFeedback('SCAN');
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Nie udało się włączyć audio.');
    }finally{
      setBusy(false);
    }
  };

  return <View style={{marginTop:14,padding:14,borderWidth:1,borderColor:'#367f95',borderRadius:16,backgroundColor:'rgba(7,30,40,.80)'}}>
    <Text style={{color:'#fff',fontSize:12,fontWeight:'900'}}>SYSTEM AUDIO // WYCISZONY</Text>
    <Text style={{color:'#9fb8c5',fontSize:11,lineHeight:17,marginTop:7}}>Ten profil ma wyłączone dźwięki. Możesz włączyć muzykę i efekty bez resetowania postępu.</Text>
    <Action disabled={busy} label={busy?'WŁĄCZANIE…':'WŁĄCZ MUZYKĘ I EFEKTY →'} onPress={()=>{void enable();}}/>
    {!!error&&<Text accessibilityRole="alert" style={{color:'#ffb9b9',marginTop:8}}>{error}</Text>}
  </View>;
}
