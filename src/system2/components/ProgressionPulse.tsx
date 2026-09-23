import {Text,View,type DimensionValue} from 'react-native';
export default function ProgressionPulse({label,value,max}:{label:string;value:number;max:number}){
  const p=max>0?Math.max(0,Math.min(1,value/max)):0;
  const width=(Math.round(p*100)+'%') as DimensionValue;
  return <View accessibilityLabel={label+' '+Math.round(p*100)+' procent'} style={{gap:6}}>
    <View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:'#8da5af',fontSize:9,fontWeight:'900',letterSpacing:1.5}}>{label}</Text><Text style={{color:'#6ceeff',fontSize:9,fontWeight:'900'}}>{Math.round(p*100)}%</Text></View>
    <View style={{height:4,borderRadius:99,backgroundColor:'#09252c',overflow:'hidden'}}><View style={{height:'100%',width,backgroundColor:'#6ceeff'}}/></View>
  </View>;
}
