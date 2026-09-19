// Mock for react-native-reanimated to be used in tests
const mockReanimated = {
  // Animated components - return strings so they can be used as JSX elements
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  
  // Animated functions and hooks - minimal implementations that don't break the code
  useSharedValue: (initialValue) => ({
    value: initialValue,
  }),
  useAnimatedStyle: () => ({}),
  useAnimatedProps: () => ({}),
  useDerivedValue: () => ({}),
  useAnimatedRef: () => ({}),
  withTiming: (toValue, config, callback) => toValue,
  withSpring: (toValue, config, callback) => toValue,
  withDecay: (config, callback) => {},
  withSequence: (...args) => args,
  withRepeat: (...args) => args,
  cancelAnimation: () => {},
  interpolate: () => 0,
  Easing: {
    linear: () => 'linear',
    ease: () => 'ease',
    in: () => 'in',
    out: () => 'out',
    inOut: () => 'inOut',
  },
  runOnJS: (fn) => fn,
  useAnimatedGestureHandler: () => ({}),
  useAnimatedScrollHandler: () => ({}),
  useAnimatedStyle: () => ({}),
  useAnimatedProps: () => ({}),
  useAnimatedRef: () => ({}),
  useDerivedValue: () => ({}),
  useAnimatedReaction: () => ({}),
};

// Export for use in test harness
module.exports = mockReanimated;