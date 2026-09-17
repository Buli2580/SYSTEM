import { useEventListener } from 'expo';
import {
    useVideoPlayer,
    VideoView,
} from 'expo-video';

import {
    useEffect,
} from 'react';

import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type Props = {
  source: any;
  title: string;
  subtitle?: string;
  buttonText?: string;
  onFinish: () => void;
};

export default function SystemVideo({
  source,
  title,
  subtitle,
  buttonText = 'DALEJ',
  onFinish,
}: Props) {
  const player =
    useVideoPlayer(
      source,
      (video) => {
        video.loop = false;
        video.muted = true;
      }
    );

  useEventListener(
    player,
    'playToEnd',
    onFinish
  );

  useEffect(() => {
    try {
      player.currentTime = 0;
      player.play();
    } catch (error) {
      console.log(
        'BŁĄD VIDEO',
        error
      );
    }
  }, []);

  return (
    <View style={styles.screen}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="cover"
      />

      <View style={styles.overlay}>
        <Text style={styles.title}>
          {title}
        </Text>

        {!!subtitle && (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        )}

        <Pressable
          style={styles.button}
          onPress={() => {
            player.pause();
            onFinish();
          }}
        >
          <Text style={styles.buttonText}>
            {buttonText}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#000',
    },

    video: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },

    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor:
        'rgba(0,0,0,0.16)',
    },

    title: {
      color: '#FFFFFF',
      fontSize: 43,
      fontWeight: '900',
      textAlign: 'center',
      letterSpacing: 3,
    },

    subtitle: {
      color: '#00D9FF',
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 4,
      marginTop: 15,
      textAlign: 'center',
    },

    button: {
      position: 'absolute',
      bottom: 55,
      left: 25,
      right: 25,
      borderWidth: 1,
      borderColor: '#00D9FF',
      backgroundColor:
        'rgba(2,10,14,0.85)',
      paddingVertical: 16,
      alignItems: 'center',
    },

    buttonText: {
      color: '#00D9FF',
      fontWeight: '900',
      letterSpacing: 2,
    },
  });