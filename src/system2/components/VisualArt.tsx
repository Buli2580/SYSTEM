import { memo, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

/** Small concept crops stay small. Labels and controls always remain native text. */
export const ArtThumbnail = memo(function ArtThumbnail({source, label, size=44}: {source?:number; label?:string; size?:number}) {
  const [failedSource,setFailedSource]=useState<number>();
  return <View pointerEvents="none" style={{width:size,height:size,flexShrink:0,alignItems:'center',justifyContent:'center'}}>
    {!source || failedSource===source ? <Text accessible={false} style={{color:'#8da5af',fontSize:22}}>◇</Text> : <Image source={source} contentFit="contain" recyclingKey={String(source)}
    onError={()=>setFailedSource(source)}
    accessible={!!label} accessibilityLabel={label} cachePolicy="none" transition={0}
    style={{width:size,height:size,flexShrink:0,borderRadius:6,backgroundColor:'#061017'}}/>}
  </View>;
});

export function ArtBackdrop({source}: {source:number}) {
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <Image source={source} contentFit="cover" contentPosition="center" cachePolicy="none" transition={0} style={StyleSheet.absoluteFill}/>
    <View style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(1,6,10,0.82)'}]}/>
  </View>;
}
