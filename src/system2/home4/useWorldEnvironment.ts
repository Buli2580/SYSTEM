import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
// Conservative until the accessibility preference resolves. No polling or background effects.
export function useWorldEnvironment() {
 const [reduced, setReduced] = useState(true);
 const [foreground, setForeground] = useState(AppState.currentState === 'active');
 const [hour, setHour] = useState(new Date().getHours());
 useEffect(() => {
  let mounted=true;
  void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(mounted)setReduced(value);}).catch(()=>{});
  const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);
  const app=AppState.addEventListener('change',state=>{setForeground(state==='active');if(state==='active')setHour(new Date().getHours());});
  return ()=>{mounted=false;motion.remove();app.remove();};
 },[]);
 useFocusEffect(useCallback(()=>{setHour(new Date().getHours());},[]));
 return {reduced,foreground,hour};
}
