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

/** Local assets decode only on mount. A failed image never blocks native controls. */
export function ArtImage({source,fit='contain',transitionMs=0}:{source?:number;fit?:'contain'|'cover';transitionMs?:number}) {
  const [failedSource,setFailedSource]=useState<number>();
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill,{backgroundColor:'#09151e'}]}>
    {!!source && failedSource!==source && <Image source={source} contentFit={fit} contentPosition="center" recyclingKey={String(source)}
      onError={()=>setFailedSource(source)} cachePolicy="none" transition={transitionMs} style={StyleSheet.absoluteFill}/>}
  </View>;
}

export function ArtBackdrop({source,transitionMs=0}: {source?:number;transitionMs?:number}) {
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <ArtImage source={source} fit="cover" transitionMs={transitionMs}/>
    <View style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(1,6,10,0.82)'}]}/>
  </View>;
}
