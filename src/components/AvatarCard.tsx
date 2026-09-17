import {
    useEffect,
    useRef,
} from 'react';

import {
    Animated,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    CLASS_META,
    PlayerClass,
} from '../system/game';

type Props = {
  avatarUri:
    string | null;

  playerClass:
    PlayerClass;

  level:
    number;

  rank:
    string;

  evolutionTitle:
    string;

  evolutionTier:
    number;

  aura:
    string;

  onEdit:
    () => void;
};

export default function AvatarCard({
  avatarUri,
  playerClass,
  level,
  rank,
  evolutionTitle,
  evolutionTier,
  aura,
  onEdit,
}: Props) {
  const pulse =
    useRef(
      new Animated.Value(0)
    ).current;

  const float =
    useRef(
      new Animated.Value(0)
    ).current;

  useEffect(() => {
    const pulseLoop =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            pulse,
            {
              toValue: 1,
              duration: 1600,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            pulse,
            {
              toValue: 0,
              duration: 1600,
              useNativeDriver: true,
            }
          ),
        ])
      );

    const floatLoop =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            float,
            {
              toValue: -6,
              duration: 1700,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            float,
            {
              toValue: 5,
              duration: 1700,
              useNativeDriver: true,
            }
          ),
        ])
      );

    pulseLoop.start();
    floatLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, []);

  const meta =
    CLASS_META[playerClass];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.auraOuter,
          {
            opacity:
              pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.8],
              }),

            transform: [
              {
                scale:
                  pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1.12],
                  }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.avatar,
          {
            transform: [
              {
                translateY: float,
              },
            ],
          },
        ]}
      >
        {avatarUri ? (
          <Image
            source={{
              uri: avatarUri,
            }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.glyph}>
              {meta.glyph}
            </Text>

            <Text style={styles.emptyText}>
              DODAJ ZDJĘCIE
            </Text>
          </View>
        )}

        <View style={styles.classPlate}>
          <Text style={styles.classTitle}>
            {meta.title}
          </Text>

          <Text style={styles.evolution}>
            {evolutionTitle}
          </Text>
        </View>
      </Animated.View>

      <View style={styles.auraTag}>
        <Text style={styles.auraText}>
          {aura}
        </Text>
      </View>

      <View style={styles.bottom}>
        <View>
          <Text style={styles.tier}>
            POZIOM EWOLUCJI{' '}
            {evolutionTier}
          </Text>

          <Text style={styles.level}>
            POZIOM {level}
            {' · '}
            RANGA {rank}
          </Text>
        </View>

        <Pressable
          style={styles.edit}
          onPress={onEdit}
        >
          <Text style={styles.editText}>
            {avatarUri
              ? 'ZMIEŃ'
              : 'DODAJ'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      height: 300,
      backgroundColor: '#071015',
      borderWidth: 1,
      borderColor: '#17333F',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 14,
    },

    auraOuter: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 2,
      borderColor: '#00D9FF',
      backgroundColor:
        'rgba(0,217,255,0.05)',
    },

    avatar: {
      width: 150,
      height: 195,
      overflow: 'hidden',
      borderRadius: 26,
      borderWidth: 1,
      borderColor: '#286176',
      backgroundColor: '#0A171D',
    },

    image: {
      width: '100%',
      height: '100%',
    },

    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    glyph: {
      color: '#00D9FF',
      fontSize: 60,
    },

    emptyText: {
      color: '#708791',
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 2,
      marginTop: 10,
    },

    classPlate: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingVertical: 9,
      backgroundColor:
        'rgba(0,8,12,0.85)',
      alignItems: 'center',
    },

    classTitle: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 2,
    },

    evolution: {
      color: '#00D9FF',
      fontSize: 7,
      marginTop: 3,
      fontWeight: '900',
    },

    auraTag: {
      position: 'absolute',
      top: 15,
      borderWidth: 1,
      borderColor: '#195064',
      backgroundColor:
        'rgba(0,10,15,0.85)',
      paddingHorizontal: 12,
      paddingVertical: 6,
    },

    auraText: {
      color: '#00D9FF',
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 2,
    },

    bottom: {
      position: 'absolute',
      left: 15,
      right: 15,
      bottom: 12,
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'flex-end',
    },

    tier: {
      color: '#74848D',
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 1,
    },

    level: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
      marginTop: 4,
    },

    edit: {
      borderWidth: 1,
      borderColor: '#25566A',
      backgroundColor: '#08151B',
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    editText: {
      color: '#00D9FF',
      fontSize: 8,
      fontWeight: '900',
    },
  });