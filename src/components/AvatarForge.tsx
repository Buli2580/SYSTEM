import {
    useEffect,
    useRef,
} from 'react';

import {
    ActivityIndicator,
    Animated,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    CLASS_META,
    PlayerClass,
} from '../system/game';

export type AvatarStyle =
  | 'DARK'
  | 'CYBER'
  | 'WARLORD';

type Props = {
  originalUri:
    string | null;

  styledUri:
    string | null;

  playerClass:
    PlayerClass;

  level:
    number;

  rank:
    string;

  selectedStyle:
    AvatarStyle;

  generating:
    boolean;

  onStyleChange:
    (
      style: AvatarStyle
    ) => void;

  onGenerate:
    () => void;

  onCamera:
    () => void;

  onGallery:
    () => void;

  onContinue:
    () => void;
};

const AVATAR_STYLES: {
  id: AvatarStyle;
  title: string;
  description: string;
}[] = [
  {
    id: 'DARK',
    title: 'MROCZNY ŁOWCA',
    description:
      'Ciemny pancerz, błękitna aura i klimat dark fantasy.',
  },

  {
    id: 'CYBER',
    title: 'CYBER SYSTEM',
    description:
      'Futurystyczny pancerz, energia i technologiczny HUD.',
  },

  {
    id: 'WARLORD',
    title: 'WŁADCA',
    description:
      'Ciężki pancerz, majestatyczny wygląd i potężna aura.',
  },
];

export default function AvatarForge({
  originalUri,
  styledUri,
  playerClass,
  level,
  rank,
  selectedStyle,
  generating,
  onStyleChange,
  onGenerate,
  onCamera,
  onGallery,
  onContinue,
}: Props) {
  const scan =
    useRef(
      new Animated.Value(0)
    ).current;

  const pulse =
    useRef(
      new Animated.Value(0)
    ).current;

  useEffect(() => {
    const scanLoop =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            scan,
            {
              toValue: 1,
              duration: 1800,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            scan,
            {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }
          ),
        ])
      );

    const pulseLoop =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            pulse,
            {
              toValue: 1,
              duration: 1300,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            pulse,
            {
              toValue: 0,
              duration: 1300,
              useNativeDriver: true,
            }
          ),
        ])
      );

    scanLoop.start();
    pulseLoop.start();

    return () => {
      scanLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const meta =
    CLASS_META[playerClass];

  const displayUri =
    styledUri ||
    originalUri;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.content
      }
    >
      <Text style={styles.signal}>
        PRZEBUDZENIE // 03
      </Text>

      <Text style={styles.title}>
        STWÓRZ
        {'\n'}
        POSTAĆ
      </Text>

      <Text style={styles.description}>
        Twoje zdjęcie będzie bazą
        dla postaci SYSTEMU.
      </Text>

      <View style={styles.avatarStage}>
        <Animated.View
          style={[
            styles.aura,
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
                      outputRange: [
                        0.92,
                        1.1,
                      ],
                    }),
                },
              ],
            },
          ]}
        />

        <View style={styles.avatarFrame}>
          {displayUri ? (
            <Image
              source={{
                uri: displayUri,
              }}
              style={styles.image}
            />
          ) : (
            <View style={styles.emptyAvatar}>
              <Text style={styles.classGlyph}>
                {meta.glyph}
              </Text>

              <Text style={styles.emptyText}>
                BRAK ZDJĘCIA
              </Text>
            </View>
          )}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY:
                      scan.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          0,
                          310,
                        ],
                      }),
                  },
                ],
              },
            ]}
          />

          {generating && (
            <View
              style={
                styles.generatingOverlay
              }
            >
              <ActivityIndicator
                color="#00D9FF"
                size="large"
              />

              <Text
                style={
                  styles.generatingTitle
                }
              >
                SYSTEM TWORZY POSTAĆ
              </Text>

              <Text
                style={
                  styles.generatingSub
                }
              >
                ANALIZA GRACZA...
              </Text>
            </View>
          )}

          <View
            style={
              styles.avatarBottom
            }
          >
            <Text
              style={
                styles.avatarClass
              }
            >
              {meta.title}
            </Text>

            <Text
              style={
                styles.avatarStatus
              }
            >
              POZIOM {level}
              {' · '}
              RANGA {rank}
            </Text>
          </View>
        </View>

        <View style={styles.sourceBadge}>
          <Text
            style={
              styles.sourceBadgeText
            }
          >
            {styledUri
              ? 'POSTAĆ SYSTEMU'
              : 'ZDJĘCIE BAZOWE'}
          </Text>
        </View>
      </View>

      <View style={styles.photoRow}>
        <Pressable
          style={styles.photoButton}
          onPress={onCamera}
        >
          <Text
            style={
              styles.photoButtonText
            }
          >
            APARAT
          </Text>
        </Pressable>

        <Pressable
          style={styles.photoButton}
          onPress={onGallery}
        >
          <Text
            style={
              styles.photoButtonText
            }
          >
            GALERIA
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>
        STYL POSTACI
      </Text>

      {AVATAR_STYLES.map(
        (item) => {
          const active =
            item.id ===
            selectedStyle;

          return (
            <Pressable
              key={item.id}
              style={[
                styles.styleCard,
                active &&
                  styles.styleCardActive,
              ]}
              onPress={() =>
                onStyleChange(
                  item.id
                )
              }
            >
              <View style={styles.styleDot}>
                <Text
                  style={
                    styles.styleDotText
                  }
                >
                  {active
                    ? '◆'
                    : '◇'}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={
                    styles.styleTitle
                  }
                >
                  {item.title}
                </Text>

                <Text
                  style={
                    styles.styleDescription
                  }
                >
                  {
                    item.description
                  }
                </Text>
              </View>
            </Pressable>
          );
        }
      )}

      <View style={styles.classInfo}>
        <Text
          style={
            styles.classInfoLabel
          }
        >
          KLASA POSTACI
        </Text>

        <Text
          style={
            styles.classInfoTitle
          }
        >
          {meta.glyph}{' '}
          {meta.title}
        </Text>

        <Text
          style={
            styles.classInfoDescription
          }
        >
          {meta.description}
        </Text>
      </View>

      <Pressable
        disabled={
          !originalUri ||
          generating
        }
        style={[
          styles.generateButton,
          (!originalUri ||
            generating) &&
            styles.disabled,
        ]}
        onPress={onGenerate}
      >
        <Text
          style={
            styles.generateButtonText
          }
        >
          {generating
            ? 'TWORZENIE...'
            : styledUri
            ? 'WYGENERUJ PONOWNIE'
            : 'GENERUJ POSTAĆ'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.continueButton}
        onPress={onContinue}
      >
        <Text
          style={
            styles.continueButtonText
          }
        >
          DALEJ
        </Text>
      </Pressable>

      {!styledUri && (
        <Text style={styles.devInfo}>
          Moduł C1 jest gotowy.
          Prawdziwa transformacja zdjęcia
          zostanie podłączona w C2.
        </Text>
      )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#05070A',
    },

    content: {
      paddingHorizontal: 24,
      paddingTop: 52,
      paddingBottom: 100,
    },

    signal: {
      color: '#00D9FF',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 3,
      marginBottom: 12,
    },

    title: {
      color: '#FFFFFF',
      fontSize: 38,
      lineHeight: 44,
      fontWeight: '900',
    },

    description: {
      color: '#819099',
      fontSize: 14,
      lineHeight: 21,
      marginTop: 12,
      marginBottom: 26,
    },

    avatarStage: {
      height: 390,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#17333F',
      backgroundColor: '#071015',
    },

    aura: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 130,
      borderWidth: 2,
      borderColor: '#00D9FF',
      backgroundColor:
        'rgba(0,217,255,0.04)',
    },

    avatarFrame: {
      width: 230,
      height: 320,
      borderWidth: 1,
      borderColor: '#2E718A',
      backgroundColor: '#09161D',
      overflow: 'hidden',
    },

    image: {
      width: '100%',
      height: '100%',
    },

    emptyAvatar: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    classGlyph: {
      color: '#00D9FF',
      fontSize: 65,
    },

    emptyText: {
      color: '#687982',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 2,
      marginTop: 10,
    },

    scanLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 2,
      backgroundColor: '#00D9FF',
      opacity: 0.65,
    },

    generatingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor:
        'rgba(0,8,12,0.88)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    generatingTitle: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 2,
      marginTop: 18,
    },

    generatingSub: {
      color: '#00D9FF',
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 2,
      marginTop: 7,
    },

    avatarBottom: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: 12,
      alignItems: 'center',
      backgroundColor:
        'rgba(0,7,11,0.87)',
    },

    avatarClass: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 2,
    },

    avatarStatus: {
      color: '#00D9FF',
      fontSize: 8,
      fontWeight: '900',
      marginTop: 4,
    },

    sourceBadge: {
      position: 'absolute',
      top: 13,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#06161D',
      borderWidth: 1,
      borderColor: '#1F5367',
    },

    sourceBadgeText: {
      color: '#00D9FF',
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 2,
    },

    photoRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },

    photoButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#244754',
      paddingVertical: 13,
      alignItems: 'center',
    },

    photoButtonText: {
      color: '#00D9FF',
      fontSize: 9,
      fontWeight: '900',
    },

    sectionLabel: {
      color: '#00D9FF',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 2,
      marginTop: 30,
      marginBottom: 9,
    },

    styleCard: {
      flexDirection: 'row',
      gap: 13,
      borderWidth: 1,
      borderColor: '#192D36',
      backgroundColor: '#081015',
      padding: 15,
      marginBottom: 8,
    },

    styleCardActive: {
      borderColor: '#00D9FF',
      backgroundColor: '#07171D',
    },

    styleDot: {
      width: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },

    styleDotText: {
      color: '#00D9FF',
      fontSize: 17,
    },

    styleTitle: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },

    styleDescription: {
      color: '#71808A',
      fontSize: 9,
      lineHeight: 15,
      marginTop: 5,
    },

    classInfo: {
      borderWidth: 1,
      borderColor: '#17333F',
      backgroundColor: '#091016',
      padding: 17,
      marginTop: 15,
    },

    classInfoLabel: {
      color: '#63727B',
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 2,
    },

    classInfoTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '900',
      marginTop: 9,
    },

    classInfoDescription: {
      color: '#77868F',
      fontSize: 10,
      lineHeight: 16,
      marginTop: 7,
    },

    generateButton: {
      backgroundColor: '#00D9FF',
      paddingVertical: 17,
      alignItems: 'center',
      marginTop: 22,
    },

    generateButtonText: {
      color: '#001015',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
    },

    disabled: {
      opacity: 0.35,
    },

    continueButton: {
      borderWidth: 1,
      borderColor: '#28505F',
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 10,
    },

    continueButtonText: {
      color: '#00D9FF',
      fontSize: 10,
      fontWeight: '900',
    },

    devInfo: {
      color: '#4E5E66',
      fontSize: 8,
      lineHeight: 13,
      textAlign: 'center',
      marginTop: 16,
    },
  });