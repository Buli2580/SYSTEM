import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// The safe viewport stays outside scrolling content. BottomNavigation handles its own bottom inset.
export default function SystemScreen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <SafeAreaView edges={['top', 'left', 'right']} style={style}>{children}</SafeAreaView>;
}
