import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { File, UploadType } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AvatarCard from '../components/AvatarCard';
import AvatarForge, { AvatarStyle } from '../components/AvatarForge';
import SystemVideo from '../components/SystemVideo';

import {
  BossQuest,
  calculateLevel,
  categoryFor,
  CLASS_META,
  createBoss,
  Difficulty,
  EMPTY_STATS,
  evolutionForLevel,
  offlineQuests,
  PlayerClass,
  PlayerStats,
  Quest,
  rankForLevel,
  startingStats,
  StatKey,
  todayKey,
} from '../system/game';

type Screen =
  | 'welcome'
  | 'identity'
  | 'class'
  | 'avatar'
  | 'goal'
  | 'system'
  | 'profile'
  | 'achievements'
  | 'shop'
  | 'history';

type HistoryEntry = {
  id: string;
  day: number;
  title: string;
  xp: number;
  coins: number;
  boss: boolean;
  date: string;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  reward: number;
  unlocked: boolean;
};

type ShopItem = {
  id: string;
  title: string;
  price: number;
  requiredRank: string;
};

const STORAGE_KEY = '@system_final_c2_v2';

/*
  WAŻNE:
  To musi być adres IP komputera w Twojej sieci Wi-Fi,
  a nie localhost.
*/
const AVATAR_API_URL = 'http://192.168.0.23:3000';

const DEV_MODE = true;

const ACHIEVEMENTS_BASE = [
  {
    id: 'firstQuest',
    title: 'PIERWSZA KREW',
    description: 'Ukończ swoją pierwszą misję.',
    reward: 25,
  },
  {
    id: 'quests10',
    title: 'ŁOWCA MISJI',
    description: 'Ukończ 10 misji.',
    reward: 100,
  },
  {
    id: 'boss1',
    title: 'POGROMCA BOSSÓW',
    description: 'Pokonaj swojego pierwszego Bossa.',
    reward: 150,
  },
  {
    id: 'streak7',
    title: 'NIEZŁOMNY',
    description: 'Osiągnij serię 7 dni.',
    reward: 200,
  },
  {
    id: 'level5',
    title: 'PRZEBUDZONY',
    description: 'Osiągnij poziom 5.',
    reward: 200,
  },
  {
    id: 'level10',
    title: 'AWANGARDA',
    description: 'Osiągnij poziom 10.',
    reward: 400,
  },
  {
    id: 'rankS',
    title: 'RANGA S',
    description: 'Osiągnij Rangę S.',
    reward: 1000,
  },
  {
    id: 'master',
    title: 'MISTRZ',
    description: 'Osiągnij poziom 40.',
    reward: 2000,
  },
  {
    id: 'monarch',
    title: 'MONARCHA',
    description: 'Osiągnij poziom 50.',
    reward: 5000,
  },
] as const;

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'rookie',
    title: 'NOWICJUSZ',
    price: 0,
    requiredRank: 'E',
  },
  {
    id: 'awakened',
    title: 'PRZEBUDZONY',
    price: 150,
    requiredRank: 'D',
  },
  {
    id: 'hunter',
    title: 'ŁOWCA',
    price: 300,
    requiredRank: 'C',
  },
  {
    id: 'vanguard',
    title: 'AWANGARDA',
    price: 500,
    requiredRank: 'B',
  },
  {
    id: 'elite',
    title: 'ELITA',
    price: 800,
    requiredRank: 'A',
  },
  {
    id: 'legend',
    title: 'LEGENDA',
    price: 1300,
    requiredRank: 'S',
  },
  {
    id: 'master',
    title: 'MISTRZ',
    price: 2200,
    requiredRank: 'MASTER',
  },
  {
    id: 'monarch',
    title: 'MONARCHA',
    price: 5000,
    requiredRank: 'MONARCH',
  },
];

const RANKS = [
  'E',
  'D',
  'C',
  'B',
  'A',
  'S',
  'MASTER',
  'MONARCH',
];

function rankValue(rank: string) {
  return RANKS.indexOf(rank);
}

function rankLabel(rank: string) {
  if (rank === 'MASTER') return 'MISTRZ';
  if (rank === 'MONARCH') return 'MONARCHA';

  return rank;
}

function difficultyLabel(value: Difficulty) {
  if (value === 'EASY') return 'ŁATWY';
  if (value === 'HARD') return 'TRUDNY';

  return 'NORMALNY';
}

function statLabel(stat: StatKey) {
  if (stat === 'strength') return 'SIŁA';
  if (stat === 'discipline') return 'DYSCYPLINA';
  if (stat === 'intelligence') return 'INTELIGENCJA';
  if (stat === 'health') return 'ZDROWIE';

  return 'MAJĄTEK';
}

function daysBetween(from: string, to: string) {
  const first = new Date(`${from}T12:00:00`).getTime();
  const second = new Date(`${to}T12:00:00`).getTime();

  return Math.round((second - first) / 86400000);
}

function makeAbsoluteImageUrl(url: string) {
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('file://') ||
    url.startsWith('content://')
  ) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${AVATAR_API_URL}${url}`;
  }

  return `${AVATAR_API_URL}/${url}`;
}

export default function Index() {
  const [loadingStorage, setLoadingStorage] = useState(true);
  const [bootFinished, setBootFinished] = useState(false);

  const [screen, setScreen] = useState<Screen>('welcome');

  const [playerName, setPlayerName] = useState('');
  const [playerClass, setPlayerClass] =
    useState<PlayerClass>('HUNTER');

  const [difficulty, setDifficulty] =
    useState<Difficulty>('NORMAL');

  const [goal, setGoal] = useState('');
  const [category, setCategory] = useState('GENERAL');

  const [avatarUri, setAvatarUri] =
    useState<string | null>(null);

  const [styledAvatarUri, setStyledAvatarUri] =
    useState<string | null>(null);

  const [avatarStyle, setAvatarStyle] =
    useState<AvatarStyle>('DARK');

  const [avatarGenerating, setAvatarGenerating] =
    useState(false);

  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);

  const [quests, setQuests] =
    useState<Quest[]>([]);

  const [bossQuest, setBossQuest] =
    useState<BossQuest | null>(null);

  const [stats, setStats] =
    useState<PlayerStats>({
      ...EMPTY_STATS,
    });

  const [day, setDay] = useState(1);
  const [streak, setStreak] = useState(1);

  const [completedCount, setCompletedCount] =
    useState(0);

  const [bossesDefeated, setBossesDefeated] =
    useState(0);

  const [mainQuestProgress, setMainQuestProgress] =
    useState(0);

  const [lastQuestDate, setLastQuestDate] =
    useState('');

  const [chestClaimed, setChestClaimed] =
    useState(false);

  const [dayRewardClaimed, setDayRewardClaimed] =
    useState(false);

  const [rerolls, setRerolls] =
    useState(1);

  const [history, setHistory] =
    useState<HistoryEntry[]>([]);

  const [
    claimedAchievements,
    setClaimedAchievements,
  ] = useState<string[]>([]);

  const [ownedTitles, setOwnedTitles] =
    useState<string[]>(['rookie']);

  const [equippedTitle, setEquippedTitle] =
    useState('rookie');

  const [musicEnabled, setMusicEnabled] =
    useState(true);

  const [sfxEnabled, setSfxEnabled] =
    useState(true);

  const [levelUpVisible, setLevelUpVisible] =
    useState(false);

  const [levelUpNumber, setLevelUpNumber] =
    useState(1);

  const [rankUpVisible, setRankUpVisible] =
    useState(false);

  const [rankUpName, setRankUpName] =
    useState('E');

  const [pendingRank, setPendingRank] =
    useState<string | null>(null);

  const [rewardText, setRewardText] =
    useState('');

  const [flashVisible, setFlashVisible] =
    useState(false);

  const [bossIntroVisible, setBossIntroVisible] =
    useState(false);

  const rewardAnim =
    useRef(new Animated.Value(0)).current;

  const flashAnim =
    useRef(new Animated.Value(0)).current;

  const xpBarAnim =
    useRef(new Animated.Value(0)).current;

  const ambientAudio = useAudioPlayer(
    require('../../assets/audio/dashboard_ambient.mp3')
  );

  const bossAudio = useAudioPlayer(
    require('../../assets/audio/boss_theme.mp3')
  );

  const questAudio = useAudioPlayer(
    require('../../assets/audio/quest_complete.mp3')
  );

  const levelAudio = useAudioPlayer(
    require('../../assets/audio/level_up.mp3')
  );

  /*
    ===== OBLICZENIA GRACZA =====
  */

  const levelState = calculateLevel(xp);

  const level = levelState.level;
  const currentXp = levelState.currentXp;
  const neededXp = levelState.neededXp;

  const rank = rankForLevel(level);
  const evolution = evolutionForLevel(level);

  const displayedAvatarUri =
    styledAvatarUri || avatarUri;

  const xpPercent = Math.max(
    0,
    Math.min(
      100,
      (currentXp / neededXp) * 100
    )
  );

  const isBossDay =
    day % 7 === 0;

  const effectiveBoss =
    isBossDay
      ? bossQuest || createBoss(goal)
      : null;

  const bossLocked = Boolean(
    isBossDay &&
      effectiveBoss &&
      !effectiveBoss.done
  );

  const completedToday =
    quests.filter(
      (quest) => quest.done
    ).length;

  const allDailyDone =
    quests.length > 0 &&
    completedToday === quests.length;

  const allDayDone =
    allDailyDone &&
    (!effectiveBoss ||
      effectiveBoss.done);

  const canStartNewDay =
    allDayDone &&
    dayRewardClaimed &&
    !bossLocked;

  const powerScore = useMemo(() => {
    return (
      stats.strength +
      stats.discipline +
      stats.intelligence +
      stats.health +
      stats.wealth
    );
  }, [stats]);

  const equippedTitleText =
    SHOP_ITEMS.find(
      (item) =>
        item.id === equippedTitle
    )?.title || 'NOWICJUSZ';

  const achievements: Achievement[] =
    ACHIEVEMENTS_BASE.map((item) => {
      let unlocked = false;

      if (item.id === 'firstQuest') {
        unlocked =
          completedCount >= 1;
      }

      if (item.id === 'quests10') {
        unlocked =
          completedCount >= 10;
      }

      if (item.id === 'boss1') {
        unlocked =
          bossesDefeated >= 1;
      }

      if (item.id === 'streak7') {
        unlocked =
          streak >= 7;
      }

      if (item.id === 'level5') {
        unlocked =
          level >= 5;
      }

      if (item.id === 'level10') {
        unlocked =
          level >= 10;
      }

      if (item.id === 'rankS') {
        unlocked =
          level >= 30;
      }

      if (item.id === 'master') {
        unlocked =
          level >= 40;
      }

      if (item.id === 'monarch') {
        unlocked =
          level >= 50;
      }

      return {
        ...item,
        unlocked,
      };
    });

  const unlockedAchievementCount =
    achievements.filter(
      (item) => item.unlocked
    ).length;

  /*
    ===== START APLIKACJI =====
  */

  useEffect(() => {
    async function prepare() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });

        ambientAudio.loop = true;
        bossAudio.loop = true;
      } catch (error) {
        console.log(
          'AUDIO INIT ERROR:',
          error
        );
      }

      await loadPlayer();
    }

    prepare();
  }, []);

  /*
    ===== AUTOMATYCZNY ZAPIS =====
  */

  useEffect(() => {
    if (loadingStorage) {
      return;
    }

    savePlayer();
  }, [
    loadingStorage,
    playerName,
    playerClass,
    difficulty,
    goal,
    category,
    avatarUri,
    styledAvatarUri,
    avatarStyle,
    xp,
    coins,
    quests,
    bossQuest,
    stats,
    day,
    streak,
    completedCount,
    bossesDefeated,
    mainQuestProgress,
    lastQuestDate,
    chestClaimed,
    dayRewardClaimed,
    rerolls,
    history,
    claimedAchievements,
    ownedTitles,
    equippedTitle,
    musicEnabled,
    sfxEnabled,
  ]);

  /*
    ===== ANIMACJA XP =====
  */

  useEffect(() => {
    Animated.timing(
      xpBarAnim,
      {
        toValue: xpPercent,
        duration: 650,
        easing:
          Easing.out(
            Easing.cubic
          ),
        useNativeDriver: false,
      }
    ).start();
  }, [xpPercent]);

  /*
    ===== MUZYKA =====
  */

  useEffect(() => {
    try {
      if (!musicEnabled) {
        ambientAudio.pause();
        bossAudio.pause();
        return;
      }

      if (
        screen === 'system' &&
        !bossIntroVisible &&
        !isBossDay
      ) {
        bossAudio.pause();
        ambientAudio.play();
      } else {
        ambientAudio.pause();
      }
    } catch (error) {
      console.log(
        'MUSIC ERROR:',
        error
      );
    }
  }, [
    musicEnabled,
    screen,
    bossIntroVisible,
    isBossDay,
  ]);

  /*
    ===== WCZYTANIE GRACZA =====
  */

  async function loadPlayer() {
    try {
      const raw =
        await AsyncStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        return;
      }

      const data =
        JSON.parse(raw);

      if (
        typeof data.playerName ===
        'string'
      ) {
        setPlayerName(
          data.playerName
        );
      }

      if (data.playerClass) {
        setPlayerClass(
          data.playerClass
        );
      }

      if (data.difficulty) {
        setDifficulty(
          data.difficulty
        );
      }

      if (
        typeof data.goal ===
        'string'
      ) {
        setGoal(data.goal);
      }

      if (
        typeof data.category ===
        'string'
      ) {
        setCategory(
          data.category
        );
      }

      if (
        typeof data.avatarUri ===
          'string' ||
        data.avatarUri === null
      ) {
        setAvatarUri(
          data.avatarUri
        );
      }

      if (
        typeof data.styledAvatarUri ===
          'string' ||
        data.styledAvatarUri ===
          null
      ) {
        setStyledAvatarUri(
          data.styledAvatarUri
        );
      }

      if (data.avatarStyle) {
        setAvatarStyle(
          data.avatarStyle
        );
      }

      if (
        typeof data.xp ===
        'number'
      ) {
        setXp(data.xp);
      }

      if (
        typeof data.coins ===
        'number'
      ) {
        setCoins(data.coins);
      }

      if (
        Array.isArray(
          data.quests
        )
      ) {
        setQuests(
          data.quests
        );
      }

      if (data.bossQuest) {
        setBossQuest(
          data.bossQuest
        );
      } else {
        setBossQuest(null);
      }

      if (data.stats) {
        setStats(data.stats);
      }

      if (
        typeof data.day ===
        'number'
      ) {
        setDay(data.day);
      }

      if (
        typeof data.streak ===
        'number'
      ) {
        setStreak(
          data.streak
        );
      }

      if (
        typeof data.completedCount ===
        'number'
      ) {
        setCompletedCount(
          data.completedCount
        );
      }

      if (
        typeof data.bossesDefeated ===
        'number'
      ) {
        setBossesDefeated(
          data.bossesDefeated
        );
      }

      if (
        typeof data.mainQuestProgress ===
        'number'
      ) {
        setMainQuestProgress(
          data.mainQuestProgress
        );
      }

      if (
        typeof data.lastQuestDate ===
        'string'
      ) {
        setLastQuestDate(
          data.lastQuestDate
        );
      }

      if (
        typeof data.chestClaimed ===
        'boolean'
      ) {
        setChestClaimed(
          data.chestClaimed
        );
      }

      if (
        typeof data.dayRewardClaimed ===
        'boolean'
      ) {
        setDayRewardClaimed(
          data.dayRewardClaimed
        );
      }

      if (
        typeof data.rerolls ===
        'number'
      ) {
        setRerolls(
          data.rerolls
        );
      }

      if (
        Array.isArray(
          data.history
        )
      ) {
        setHistory(
          data.history
        );
      }

      if (
        Array.isArray(
          data.claimedAchievements
        )
      ) {
        setClaimedAchievements(
          data.claimedAchievements
        );
      }

      if (
        Array.isArray(
          data.ownedTitles
        )
      ) {
        setOwnedTitles(
          data.ownedTitles
        );
      }

      if (
        typeof data.equippedTitle ===
        'string'
      ) {
        setEquippedTitle(
          data.equippedTitle
        );
      }

      if (
        typeof data.musicEnabled ===
        'boolean'
      ) {
        setMusicEnabled(
          data.musicEnabled
        );
      }

      if (
        typeof data.sfxEnabled ===
        'boolean'
      ) {
        setSfxEnabled(
          data.sfxEnabled
        );
      }

      /*
        Jeśli istnieje już gotowy gracz,
        od razu wchodzimy do SYSTEMU.
      */
      if (
        data.playerName &&
        data.goal
      ) {
        setScreen('system');
      }
    } catch (error) {
      console.log(
        'LOAD SAVE ERROR:',
        error
      );
    } finally {
      setLoadingStorage(
        false
      );
    }
  }

  /*
    ===== ZAPIS GRACZA =====
  */

  async function savePlayer() {
    try {
      const data = {
        playerName,
        playerClass,
        difficulty,
        goal,
        category,

        avatarUri,
        styledAvatarUri,
        avatarStyle,

        xp,
        coins,

        quests,
        bossQuest,

        stats,

        day,
        streak,

        completedCount,
        bossesDefeated,

        mainQuestProgress,
        lastQuestDate,

        chestClaimed,
        dayRewardClaimed,

        rerolls,

        history,

        claimedAchievements,

        ownedTitles,
        equippedTitle,

        musicEnabled,
        sfxEnabled,
      };

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.log(
        'SAVE ERROR:',
        error
      );
    }
  }

  /*
    ===== EFEKTY =====
  */

  async function playOneShot(
    player: any
  ) {
    if (!sfxEnabled) {
      return;
    }

    try {
      player.pause();
      player.currentTime = 0;
      player.play();
    } catch (error) {
      console.log(
        'SFX ERROR:',
        error
      );
    }
  }

  function showReward(
    text: string
  ) {
    setRewardText(text);

    rewardAnim.stopAnimation();
    rewardAnim.setValue(0);

    Animated.sequence([
      Animated.timing(
        rewardAnim,
        {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }
      ),

      Animated.delay(1250),

      Animated.timing(
        rewardAnim,
        {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }
      ),
    ]).start();
  }

  function showFlash() {
    setFlashVisible(true);
    flashAnim.setValue(0);

    Animated.sequence([
      Animated.timing(
        flashAnim,
        {
          toValue: 0.45,
          duration: 90,
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        flashAnim,
        {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }
      ),
    ]).start(() => {
      setFlashVisible(false);
    });
  }
    /*
    ===== ZDJĘCIE GRACZA =====
  */

  async function choosePhoto() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'BRAK DOSTĘPU',
          'SYSTEM potrzebuje dostępu do galerii.'
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,

          allowsEditing: true,

          aspect: [3, 4],

          quality: 0.9,
        });

      if (
        !result.canceled &&
        result.assets?.[0]?.uri
      ) {
        setAvatarUri(
          result.assets[0].uri
        );

        /*
          Nowe zdjęcie = kasujemy
          poprzednią wygenerowaną postać.
        */
        setStyledAvatarUri(null);
      }
    } catch (error) {
      console.log(
        'GALLERY ERROR:',
        error
      );

      Alert.alert(
        'BŁĄD',
        'Nie udało się otworzyć galerii.'
      );
    }
  }

  async function takePhoto() {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'BRAK DOSTĘPU',
          'SYSTEM potrzebuje dostępu do aparatu.'
        );

        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,

          allowsEditing: true,

          aspect: [3, 4],

          quality: 0.9,
        });

      if (
        !result.canceled &&
        result.assets?.[0]?.uri
      ) {
        setAvatarUri(
          result.assets[0].uri
        );

        setStyledAvatarUri(null);
      }
    } catch (error) {
      console.log(
        'CAMERA ERROR:',
        error
      );

      Alert.alert(
        'BŁĄD',
        'Nie udało się uruchomić aparatu.'
      );
    }
  }

  function avatarMenu() {
    Alert.alert(
      'ZDJĘCIE GRACZA',
      'Wybierz źródło zdjęcia.',
      [
        {
          text: 'APARAT',
          onPress: takePhoto,
        },
        {
          text: 'GALERIA',
          onPress: choosePhoto,
        },
        {
          text: 'ANULUJ',
          style: 'cancel',
        },
      ]
    );
  }

  /*
    =================================
    C2 — PRAWDZIWY GENERATOR POSTACI
    =================================

    Nie używamy FormData.

    File.upload() wysyła zdjęcie
    bezpośrednio jako multipart.
  */

  async function generateSystemAvatar() {
    if (!avatarUri) {
      Alert.alert(
        'BRAK ZDJĘCIA',
        'Najpierw dodaj swoje zdjęcie.'
      );

      return;
    }

    if (avatarGenerating) {
      return;
    }

    setAvatarGenerating(true);

    try {
      const avatarFile =
        new File(avatarUri);

      if (!avatarFile.exists) {
        throw new Error(
          'SYSTEM nie może odnaleźć zdjęcia na telefonie.'
        );
      }

      console.log(
        '========================'
      );

      console.log(
        'SYSTEM AVATAR C2'
      );

      console.log(
        'PLIK:',
        avatarFile.uri
      );

      console.log(
        'TYP:',
        avatarFile.type
      );

      console.log(
        'SERWER:',
        `${AVATAR_API_URL}/api/generate-avatar`
      );

      console.log(
        'KLASA:',
        playerClass
      );

      console.log(
        'STYL:',
        avatarStyle
      );

      const result =
        await avatarFile.upload(
          `${AVATAR_API_URL}/api/generate-avatar`,
          {
            httpMethod: 'POST',

            uploadType:
              UploadType.MULTIPART,

            fieldName: 'avatar',

            mimeType:
              avatarFile.type ||
              'image/jpeg',

            parameters: {
              playerClass:
                String(
                  playerClass
                ),

              style:
                String(
                  avatarStyle
                ),

              level:
                String(level),

              rank:
                String(rank),

              playerName:
                playerName ||
                'GRACZ',
            },
          }
        );

      console.log(
        'STATUS:',
        result.status
      );

      console.log(
        'BODY:',
        result.body
      );

      let data: any;

      try {
        data =
          JSON.parse(
            result.body
          );
      } catch {
        throw new Error(
          result.body ||
            'Serwer zwrócił nieprawidłową odpowiedź.'
        );
      }

      if (
        result.status < 200 ||
        result.status >= 300
      ) {
        const backendMessage =
          data?.error ||
          data?.message ||
          data?.details ||
          `Błąd backendu ${result.status}`;

        throw new Error(
          backendMessage
        );
      }

      if (!data?.imageUrl) {
        throw new Error(
          'Backend nie zwrócił imageUrl.'
        );
      }

      const finalImageUrl =
        makeAbsoluteImageUrl(
          data.imageUrl
        );

      console.log(
        'GOTOWY AVATAR:',
        finalImageUrl
      );

      setStyledAvatarUri(
        finalImageUrl
      );

      showFlash();

      showReward(
        'POSTAĆ SYSTEMU UTWORZONA'
      );

      Alert.alert(
        'TRANSFORMACJA ZAKOŃCZONA',
        'Twoja postać SYSTEMU została wygenerowana.'
      );
    } catch (error: any) {
      console.log(
        'AVATAR C2 ERROR:',
        error
      );

      let message =
        error?.message ||
        'Nie udało się wygenerować postaci.';

      if (
        message.includes(
          'Network'
        ) ||
        message.includes(
          'network'
        ) ||
        message.includes(
          'Failed to connect'
        )
      ) {
        message =
          'Telefon nie może połączyć się z backendem SYSTEMU. Sprawdź, czy komputer i telefon są w tej samej sieci Wi-Fi oraz czy serwer działa na porcie 3000.';
      }

      if (
        message.includes(
          'insufficient_quota'
        ) ||
        message.includes(
          'credit_balance'
        )
      ) {
        message =
          'Konto API nie ma dostępnych środków lub limitu na generowanie obrazu.';
      }

      if (
        message.includes(
          '401'
        ) ||
        message.includes(
          'Incorrect API key'
        )
      ) {
        message =
          'Backend nie ma poprawnego klucza API.';
      }

      if (
        message.includes(
          '404'
        )
      ) {
        message =
          'Backend działa, ale endpoint generatora /api/generate-avatar nie został znaleziony.';
      }

      Alert.alert(
        'BŁĄD GENERATORA',
        message
      );
    } finally {
      setAvatarGenerating(
        false
      );
    }
  }

  /*
    ===== GENEROWANIE DNIA =====

    Questy pozostają lokalne,
    więc pojawiają się natychmiast.
  */

  function createOfflineDay(
    targetDay: number,
    currentGoal: string
  ) {
    const newQuests =
      offlineQuests(
        currentGoal,
        targetDay
      );

    setQuests(
      newQuests
    );

    if (
      targetDay % 7 === 0
    ) {
      setBossQuest(
        createBoss(
          currentGoal
        )
      );
    } else {
      setBossQuest(null);
    }
  }

  /*
    ===== NOWY GRACZ =====
  */

  function initializePlayer() {
    const cleanName =
      playerName.trim();

    const cleanGoal =
      goal.trim();

    if (
      cleanName.length < 2
    ) {
      Alert.alert(
        'BRAK NAZWY',
        'Wpisz nazwę gracza.'
      );

      return;
    }

    if (
      cleanGoal.length < 3
    ) {
      Alert.alert(
        'BRAK MISJI',
        'Wpisz swoją główną misję.'
      );

      return;
    }

    setPlayerName(
      cleanName
    );

    setGoal(
      cleanGoal
    );

    setCategory(
      categoryFor(
        cleanGoal
      ).toUpperCase()
    );

    setStats(
      startingStats(
        playerClass
      )
    );

    setXp(0);
    setCoins(0);

    setDay(1);
    setStreak(1);

    setCompletedCount(0);
    setBossesDefeated(0);

    setMainQuestProgress(0);

    setLastQuestDate('');

    setChestClaimed(false);
    setDayRewardClaimed(false);

    setRerolls(1);

    setHistory([]);

    setClaimedAchievements(
      []
    );

    setOwnedTitles([
      'rookie',
    ]);

    setEquippedTitle(
      'rookie'
    );

    createOfflineDay(
      1,
      cleanGoal
    );

    setScreen(
      'system'
    );

    showFlash();

    showReward(
      'SYSTEM AKTYWOWANY'
    );
  }

  /*
    ===== XP =====
  */

  function applyDifficultyXp(
    value: number
  ) {
    if (
      difficulty === 'EASY'
    ) {
      return Math.round(
        value * 0.9
      );
    }

    if (
      difficulty === 'HARD'
    ) {
      return Math.round(
        value * 1.15
      );
    }

    return value;
  }

  function addStat(
    stat: StatKey,
    amount: number
  ) {
    setStats(
      (old) => ({
        ...old,

        [stat]:
          old[stat] +
          amount,
      })
    );
  }

  function addXp(
    rawAmount: number
  ) {
    const amount =
      applyDifficultyXp(
        rawAmount
      );

    const oldState =
      calculateLevel(xp);

    const oldRank =
      rankForLevel(
        oldState.level
      );

    const newTotal =
      xp + amount;

    const newState =
      calculateLevel(
        newTotal
      );

    const newRank =
      rankForLevel(
        newState.level
      );

    setXp(
      newTotal
    );

    /*
      LEVEL UP
    */

    if (
      newState.level >
      oldState.level
    ) {
      setLevelUpNumber(
        newState.level
      );

      setLevelUpVisible(
        true
      );

      showFlash();

      playOneShot(
        levelAudio
      );

      /*
        Jeśli równocześnie
        nastąpił awans rangi,
        pokażemy go po ekranie level-up.
      */

      if (
        newRank !==
        oldRank
      ) {
        setPendingRank(
          newRank
        );
      }
    } else if (
      newRank !==
      oldRank
    ) {
      setRankUpName(
        newRank
      );

      setRankUpVisible(
        true
      );
    }

    return amount;
  }

  function closeLevelUp() {
    setLevelUpVisible(
      false
    );

    if (pendingRank) {
      const promotedRank =
        pendingRank;

      setPendingRank(
        null
      );

      setTimeout(
        () => {
          setRankUpName(
            promotedRank
          );

          setRankUpVisible(
            true
          );
        },
        250
      );
    }
  }

  /*
    ===== HISTORIA =====
  */

  function addHistory(
    quest:
      | Quest
      | BossQuest,
    boss = false
  ) {
    const entry:
      HistoryEntry = {
      id:
        `${Date.now()}-${quest.id}`,

      day,

      title:
        quest.title,

      xp:
        quest.xp,

      coins:
        quest.coins,

      boss,

      date:
        todayKey(),
    };

    setHistory(
      (old) => [
        entry,
        ...old,
      ]
    );
  }

  /*
    ===== UKOŃCZENIE QUESTA =====
  */

  function completeQuest(
    questId: number
  ) {
    const quest =
      quests.find(
        (item) =>
          item.id ===
          questId
      );

    if (
      !quest ||
      quest.done
    ) {
      return;
    }

    const earnedXp =
      addXp(
        quest.xp
      );

    setCoins(
      (old) =>
        old +
        quest.coins
    );

    addStat(
      quest.stat,
      quest.statGain
    );

    setQuests(
      (old) =>
        old.map(
          (item) =>
            item.id ===
            questId
              ? {
                  ...item,
                  done: true,
                }
              : item
        )
    );

    setCompletedCount(
      (old) =>
        old + 1
    );

    /*
      Główna misja rośnie
      powoli wraz z normalnymi questami.
    */

    setMainQuestProgress(
      (old) =>
        Math.min(
          100,
          old + 1
        )
    );

    setLastQuestDate(
      todayKey()
    );

    addHistory(
      quest,
      false
    );

    playOneShot(
      questAudio
    );

    showFlash();

    showReward(
      `+${earnedXp} XP  ·  +${quest.coins} MONET  ·  +${quest.statGain} ${statLabel(
        quest.stat
      )}`
    );
  }

  /*
    ===== BOSS =====
  */

  function startBossIntro() {
    if (
      !effectiveBoss ||
      effectiveBoss.done
    ) {
      return;
    }

    try {
      ambientAudio.pause();

      if (musicEnabled) {
        bossAudio.pause();

        bossAudio.currentTime =
          0;

        bossAudio.play();
      }
    } catch (error) {
      console.log(
        'BOSS MUSIC ERROR:',
        error
      );
    }

    setBossIntroVisible(
      true
    );
  }

  function closeBossIntro() {
    setBossIntroVisible(
      false
    );
  }

  function completeBoss() {
    if (
      !effectiveBoss ||
      effectiveBoss.done
    ) {
      return;
    }

    const boss =
      effectiveBoss;

    const earnedXp =
      addXp(
        boss.xp
      );

    setCoins(
      (old) =>
        old +
        boss.coins
    );

    addStat(
      boss.stat,
      boss.statGain
    );

    setBossQuest({
      ...boss,
      done: true,
    });

    setBossesDefeated(
      (old) =>
        old + 1
    );

    setCompletedCount(
      (old) =>
        old + 1
    );

    setMainQuestProgress(
      (old) =>
        Math.min(
          100,
          old + 5
        )
    );

    setLastQuestDate(
      todayKey()
    );

    addHistory(
      boss,
      true
    );

    try {
      bossAudio.pause();
    } catch (error) {
      console.log(
        'BOSS AUDIO ERROR:',
        error
      );
    }

    playOneShot(
      questAudio
    );

    showFlash();

    showReward(
      `BOSS POKONANY  ·  +${earnedXp} XP  ·  +${boss.coins} MONET`
    );
  }

  /*
    ===== SKRZYNIA =====
  */

  function claimChest() {
    if (chestClaimed) {
      return;
    }

    const rewardCoins =
      25 +
      Math.min(
        day * 2,
        50
      );

    setCoins(
      (old) =>
        old +
        rewardCoins
    );

    setChestClaimed(
      true
    );

    showFlash();

    showReward(
      `DZIENNA SKRZYNIA  ·  +${rewardCoins} MONET`
    );
  }

  /*
    ===== NAGRODA ZA DZIEŃ =====
  */

  function claimDayReward() {
    if (
      !allDayDone ||
      dayRewardClaimed
    ) {
      return;
    }

    const baseXp = 50;
    const rewardCoins = 30;

    const earnedXp =
      addXp(
        baseXp
      );

    setCoins(
      (old) =>
        old +
        rewardCoins
    );

    setDayRewardClaimed(
      true
    );

    showFlash();

    showReward(
      `DZIEŃ UKOŃCZONY  ·  +${earnedXp} XP  ·  +${rewardCoins} MONET`
    );
  }

  /*
    ===== NOWY DZIEŃ =====
  */

  function startNewDay(
    force = false
  ) {
    /*
      Nawet tryb developerski
      nie może ominąć żywego Bossa.
    */

    if (bossLocked) {
      Alert.alert(
        'BRAMA ZABLOKOWANA',
        'Pokonaj Bossa, zanim przejdziesz dalej.'
      );

      return;
    }

    if (
      !force &&
      !allDayDone
    ) {
      Alert.alert(
        'DZIEŃ NIEUKOŃCZONY',
        'Najpierw ukończ wszystkie misje.'
      );

      return;
    }

    const nextDay =
      day + 1;

    const today =
      todayKey();

    if (lastQuestDate) {
      const difference =
        daysBetween(
          lastQuestDate,
          today
        );

      if (
        difference <= 1
      ) {
        setStreak(
          (old) =>
            old + 1
        );
      } else {
        setStreak(1);
      }
    } else {
      setStreak(
        (old) =>
          old + 1
      );
    }

    try {
      bossAudio.pause();
    } catch {}

    setDay(
      nextDay
    );

    setChestClaimed(
      false
    );

    setDayRewardClaimed(
      false
    );

    setRerolls(1);

    createOfflineDay(
      nextDay,
      goal
    );

    showFlash();

    showReward(
      `ROZPOCZĘTO DZIEŃ ${nextDay}`
    );
  }

  /*
    ===== ZMIANA QUESTÓW =====
  */

  function rerollQuests() {
    if (
      completedToday > 0
    ) {
      Alert.alert(
        'ZMIANA ZABLOKOWANA',
        'Po ukończeniu misji nie możesz już zmienić dzisiejszego zestawu.'
      );

      return;
    }

    if (rerolls > 0) {
      setRerolls(
        (old) =>
          Math.max(
            0,
            old - 1
          )
      );
    } else {
      if (coins < 25) {
        Alert.alert(
          'ZA MAŁO MONET',
          'Nowy zestaw misji kosztuje 25 monet.'
        );

        return;
      }

      setCoins(
        (old) =>
          old - 25
      );
    }

    /*
      Inny seed =
      inny wariant zestawu.
    */

    const rerollSeed =
      day +
      1000 +
      Math.floor(
        Math.random() *
          100000
      );

    const newQuests =
      offlineQuests(
        goal,
        rerollSeed
      );

    setQuests(
      newQuests
    );

    showFlash();

    showReward(
      'NOWE MISJE WYGENEROWANE'
    );
  }

  /*
    ===== OSIĄGNIĘCIA =====
  */

  function claimAchievement(
    achievement:
      Achievement
  ) {
    if (
      !achievement.unlocked
    ) {
      return;
    }

    if (
      claimedAchievements.includes(
        achievement.id
      )
    ) {
      return;
    }

    setClaimedAchievements(
      (old) => [
        ...old,
        achievement.id,
      ]
    );

    setCoins(
      (old) =>
        old +
        achievement.reward
    );

    showFlash();

    showReward(
      `${achievement.title}  ·  +${achievement.reward} MONET`
    );
  }

  /*
    ===== SKLEP / TYTUŁY =====
  */

  function buyOrEquipTitle(
    item: ShopItem
  ) {
    const owned =
      ownedTitles.includes(
        item.id
      );

    const equipped =
      equippedTitle ===
      item.id;

    const unlocked =
      rankValue(rank) >=
      rankValue(
        item.requiredRank
      );

    if (!unlocked) {
      Alert.alert(
        'TYTUŁ ZABLOKOWANY',
        `Wymagana Ranga ${rankLabel(
          item.requiredRank
        )}.`
      );

      return;
    }

    if (equipped) {
      return;
    }

    if (owned) {
      setEquippedTitle(
        item.id
      );

      showReward(
        `ZAŁOŻONO: ${item.title}`
      );

      return;
    }

    if (
      coins <
      item.price
    ) {
      Alert.alert(
        'ZA MAŁO MONET',
        `Potrzebujesz ${item.price} monet.`
      );

      return;
    }

    setCoins(
      (old) =>
        old -
        item.price
    );

    setOwnedTitles(
      (old) => [
        ...old,
        item.id,
      ]
    );

    setEquippedTitle(
      item.id
    );

    showFlash();

    showReward(
      `ODBLOKOWANO: ${item.title}`
    );
  }

  /*
    ===== PEŁNY RESET =====
  */

  function resetEverything() {
    Alert.alert(
      'RESET SYSTEMU',
      'Usunąć całą postać i cały zapis gry?',
      [
        {
          text: 'ANULUJ',
          style: 'cancel',
        },

        {
          text: 'RESETUJ',
          style: 'destructive',

          onPress:
            async () => {
              try {
                ambientAudio.pause();
                bossAudio.pause();

                await AsyncStorage.removeItem(
                  STORAGE_KEY
                );

                setPlayerName('');

                setPlayerClass(
                  'HUNTER'
                );

                setDifficulty(
                  'NORMAL'
                );

                setGoal('');

                setCategory(
                  'GENERAL'
                );

                setAvatarUri(
                  null
                );

                setStyledAvatarUri(
                  null
                );

                setAvatarStyle(
                  'DARK'
                );

                setAvatarGenerating(
                  false
                );

                setXp(0);
                setCoins(0);

                setQuests([]);

                setBossQuest(
                  null
                );

                setStats({
                  ...EMPTY_STATS,
                });

                setDay(1);
                setStreak(1);

                setCompletedCount(
                  0
                );

                setBossesDefeated(
                  0
                );

                setMainQuestProgress(
                  0
                );

                setLastQuestDate(
                  ''
                );

                setChestClaimed(
                  false
                );

                setDayRewardClaimed(
                  false
                );

                setRerolls(1);

                setHistory([]);

                setClaimedAchievements(
                  []
                );

                setOwnedTitles([
                  'rookie',
                ]);

                setEquippedTitle(
                  'rookie'
                );

                setLevelUpVisible(
                  false
                );

                setRankUpVisible(
                  false
                );

                setPendingRank(
                  null
                );

                setBossIntroVisible(
                  false
                );

                /*
                  Boot zostawiamy zakończony,
                  żeby po resecie nie odpalać
                  filmu drugi raz.
                */

                setBootFinished(
                  true
                );

                setScreen(
                  'welcome'
                );

                showReward(
                  'SYSTEM ZRESETOWANY'
                );
              } catch (error) {
                console.log(
                  'RESET ERROR:',
                  error
                );
              }
            },
        },
      ]
    );
  }
    /*
    ===== LOADING =====
  */

  if (loadingStorage) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          color="#00D9FF"
          size="large"
        />

        <Text style={styles.loadingText}>
          URUCHAMIANIE SYSTEMU...
        </Text>
      </View>
    );
  }

  /*
    ===== FILM STARTOWY =====
  */

  if (!bootFinished) {
    return (
      <SystemVideo
        source={require(
          '../../assets/video/system_boot.mp4'
        )}
        title="SYSTEM"
        subtitle="PROTOKÓŁ PRZEBUDZENIA"
        buttonText="WEJDŹ DO SYSTEMU"
        onFinish={() =>
          setBootFinished(true)
        }
      />
    );
  }

  /*
    ===== FILM BOSSA =====
  */

  if (bossIntroVisible) {
    return (
      <SystemVideo
        source={require(
          '../../assets/video/boss_intro.mp4'
        )}
        title="OSTRZEŻENIE"
        subtitle={`DZIEŃ ${day} // WYKRYTO BRAMĘ BOSSA`}
        buttonText="WEJDŹ DO BRAMY"
        onFinish={
          closeBossIntro
        }
      />
    );
  }

  /*
    ===== START =====
  */

  if (screen === 'welcome') {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#05070A"
        />

        <View style={styles.welcomeCenter}>
          <Text style={styles.signal}>
            ● SYSTEM AKTYWNY
          </Text>

          <Text style={styles.bigTitle}>
            OBUDŹ SIĘ.
            {'\n'}
            ROZWIJAJ.
            {'\n'}
            AWANSUJ.
          </Text>

          <Text style={styles.description}>
            Zamień prawdziwe życie
            w system rozwoju postaci.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>
              STATUS SYSTEMU
            </Text>

            <Text style={styles.infoValueBlue}>
              ONLINE
            </Text>

            <View style={styles.divider} />

            <Text style={styles.infoLabel}>
              GRACZ
            </Text>

            <Text style={styles.infoValue}>
              NIEAKTYWNY
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            setScreen('identity')
          }
        >
          <Text style={styles.primaryButtonText}>
            AKTYWUJ GRACZA
          </Text>
        </Pressable>
      </View>
    );
  }

  /*
    ===== TOŻSAMOŚĆ =====
  */

  if (screen === 'identity') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentBottom
        }
      >
        <Text style={styles.signal}>
          PRZEBUDZENIE // 01
        </Text>

        <Text style={styles.screenTitle}>
          TOŻSAMOŚĆ
          {'\n'}
          GRACZA
        </Text>

        <Pressable
          style={styles.identityPhoto}
          onPress={avatarMenu}
        >
          {avatarUri ? (
            <Image
              source={{
                uri: avatarUri,
              }}
              style={
                styles.identityPhotoImage
              }
            />
          ) : (
            <View
              style={
                styles.identityPhotoEmpty
              }
            >
              <Text
                style={
                  styles.identityPhotoIcon
                }
              >
                ◉
              </Text>

              <Text
                style={
                  styles.identityPhotoText
                }
              >
                DODAJ ZDJĘCIE
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.photoButtonRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={takePhoto}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              APARAT
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={choosePhoto}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              GALERIA
            </Text>
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>
          NAZWA GRACZA
        </Text>

        <TextInput
          style={styles.inputSmall}
          value={playerName}
          onChangeText={
            setPlayerName
          }
          placeholder="Wpisz nazwę gracza"
          placeholderTextColor="#53616A"
          maxLength={20}
        />

        <Text style={styles.fieldLabel}>
          POZIOM TRUDNOŚCI
        </Text>

        <View style={styles.difficultyRow}>
          {(
            [
              'EASY',
              'NORMAL',
              'HARD',
            ] as Difficulty[]
          ).map((item) => (
            <Pressable
              key={item}
              style={[
                styles.difficultyButton,

                difficulty === item &&
                  styles.difficultyButtonActive,
              ]}
              onPress={() =>
                setDifficulty(item)
              }
            >
              <Text
                style={[
                  styles.difficultyText,

                  difficulty === item &&
                    styles.difficultyTextActive,
                ]}
              >
                {difficultyLabel(item)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.helpText}>
          {difficulty === 'EASY'
            ? '90% XP · spokojniejsze tempo.'
            : difficulty === 'HARD'
            ? '115% XP · szybszy rozwój.'
            : '100% XP · standardowe tempo.'}
        </Text>

        <Pressable
          disabled={
            playerName.trim().length < 2
          }
          style={[
            styles.primaryButtonInline,

            playerName.trim().length <
              2 &&
              styles.disabledButton,
          ]}
          onPress={() =>
            setScreen('class')
          }
        >
          <Text style={styles.primaryButtonText}>
            WYBIERZ KLASĘ
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  /*
    ===== KLASA =====
  */

  if (screen === 'class') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentBottom
        }
      >
        <Text style={styles.signal}>
          PRZEBUDZENIE // 02
        </Text>

        <Text style={styles.screenTitle}>
          WYBIERZ KLASĘ
        </Text>

        <Text
          style={
            styles.descriptionSmall
          }
        >
          Klasa określa początkowy
          charakter Twojej postaci
          i statystyk.
        </Text>

        {(
          Object.keys(
            CLASS_META
          ) as PlayerClass[]
        ).map((classKey) => {
          const meta =
            CLASS_META[
              classKey
            ];

          const active =
            classKey ===
            playerClass;

          return (
            <Pressable
              key={classKey}
              style={[
                styles.classCard,

                active &&
                  styles.classCardActive,
              ]}
              onPress={() =>
                setPlayerClass(
                  classKey
                )
              }
            >
              <View
                style={
                  styles.classGlyphBox
                }
              >
                <Text
                  style={
                    styles.classGlyph
                  }
                >
                  {meta.glyph}
                </Text>
              </View>

              <View
                style={
                  styles.classTextArea
                }
              >
                <Text
                  style={
                    styles.classTitle
                  }
                >
                  {meta.title}
                </Text>

                <Text
                  style={
                    styles.classSubtitle
                  }
                >
                  {meta.subtitle}
                </Text>

                <Text
                  style={
                    styles.classDescription
                  }
                >
                  {meta.description}
                </Text>
              </View>
            </Pressable>
          );
        })}

        <Pressable
          style={
            styles.primaryButtonInline
          }
          onPress={() =>
            setScreen('avatar')
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            POTWIERDŹ{' '}
            {
              CLASS_META[
                playerClass
              ].title
            }
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  /*
    ===== AVATAR FORGE C2 =====
  */

  if (screen === 'avatar') {
    return (
      <AvatarForge
        originalUri={
          avatarUri
        }
        styledUri={
          styledAvatarUri
        }
        playerClass={
          playerClass
        }
        level={level}
        rank={rankLabel(rank)}
        selectedStyle={
          avatarStyle
        }
        generating={
          avatarGenerating
        }
        onStyleChange={
          setAvatarStyle
        }
        onGenerate={
          generateSystemAvatar
        }
        onCamera={
          takePhoto
        }
        onGallery={
          choosePhoto
        }
        onContinue={() => {
          /*
            Jeśli gracz ma już główną
            misję, oznacza to, że
            edytował avatar z dashboardu.

            Wracamy wtedy bezpośrednio
            do SYSTEMU.
          */

          if (goal.trim().length >= 3) {
            setScreen('system');
          } else {
            setScreen('goal');
          }
        }}
      />
    );
  }

  /*
    ===== GŁÓWNA MISJA =====
  */

  if (screen === 'goal') {
    return (
      <View style={styles.container}>
        <Text style={styles.signal}>
          PRZEBUDZENIE // 04
        </Text>

        <Text style={styles.screenTitle}>
          GŁÓWNA MISJA
        </Text>

        <Text style={styles.description}>
          Jaki cel chcesz osiągnąć
          w prawdziwym życiu?
        </Text>

        <TextInput
          style={styles.goalInput}
          value={goal}
          onChangeText={setGoal}
          placeholder="Np. zbudować firmę zarabiającą 1 000 000 zł"
          placeholderTextColor="#53616A"
          multiline
        />

        <View style={{ flex: 1 }} />

        <Pressable
          disabled={
            goal.trim().length < 3
          }
          style={[
            styles.primaryButton,

            goal.trim().length < 3 &&
              styles.disabledButton,
          ]}
          onPress={
            initializePlayer
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            URUCHOM SYSTEM
          </Text>
        </Pressable>
      </View>
    );
  }

  /*
    ===== PROFIL =====
  */

  if (screen === 'profile') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentBottom
        }
      >
        <Pressable
          onPress={() =>
            setScreen('system')
          }
        >
          <Text style={styles.backText}>
            ← SYSTEM
          </Text>
        </Pressable>

        <Text style={styles.signal}>
          PROFIL GRACZA
        </Text>

        <Text style={styles.profileName}>
          {playerName.toUpperCase()}
        </Text>

        <Text
          style={
            styles.profileSubtitle
          }
        >
          {equippedTitleText}
          {' // '}
          {
            CLASS_META[
              playerClass
            ].title
          }
        </Text>

        <AvatarCard
          avatarUri={
            displayedAvatarUri
          }
          playerClass={
            playerClass
          }
          level={level}
          rank={rankLabel(rank)}
          evolutionTitle={
            evolution.title
          }
          evolutionTier={
            evolution.tier
          }
          aura={
            evolution.aura
          }
          onEdit={() =>
            setScreen('avatar')
          }
        />

        <View
          style={
            styles.profileSummary
          }
        >
          <View
            style={
              styles.profileSummaryItem
            }
          >
            <Text style={styles.infoLabel}>
              POZIOM
            </Text>

            <Text
              style={
                styles.profileSummaryValue
              }
            >
              {level}
            </Text>
          </View>

          <View
            style={
              styles.profileSummaryItem
            }
          >
            <Text style={styles.infoLabel}>
              RANGA
            </Text>

            <Text
              style={
                styles.profileRankValue
              }
            >
              {rankLabel(rank)}
            </Text>
          </View>

          <View
            style={
              styles.profileSummaryItem
            }
          >
            <Text style={styles.infoLabel}>
              MOC
            </Text>

            <Text
              style={
                styles.profileSummaryValue
              }
            >
              {powerScore}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          STATYSTYKI
        </Text>

        {(
          Object.keys(
            stats
          ) as StatKey[]
        ).map((statKey) => (
          <View
            key={statKey}
            style={styles.statRow}
          >
            <Text style={styles.statName}>
              {statLabel(statKey)}
            </Text>

            <Text style={styles.statValue}>
              {stats[statKey]}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>
          DŹWIĘK
        </Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View>
              <Text
                style={
                  styles.settingTitle
                }
              >
                MUZYKA
              </Text>

              <Text
                style={
                  styles.settingDescription
                }
              >
                Tło SYSTEMU i Bossowie
              </Text>
            </View>

            <Pressable
              style={[
                styles.toggle,

                musicEnabled &&
                  styles.toggleActive,
              ]}
              onPress={() => {
                const next =
                  !musicEnabled;

                setMusicEnabled(next);

                if (!next) {
                  ambientAudio.pause();
                  bossAudio.pause();
                }
              }}
            >
              <Text
                style={[
                  styles.toggleText,

                  musicEnabled &&
                    styles.toggleTextActive,
                ]}
              >
                {musicEnabled
                  ? 'WŁ.'
                  : 'WYŁ.'}
              </Text>
            </Pressable>
          </View>

          <View
            style={
              styles.settingDivider
            }
          />

          <View style={styles.settingRow}>
            <View>
              <Text
                style={
                  styles.settingTitle
                }
              >
                EFEKTY
              </Text>

              <Text
                style={
                  styles.settingDescription
                }
              >
                Misje, nagrody i awanse
              </Text>
            </View>

            <Pressable
              style={[
                styles.toggle,

                sfxEnabled &&
                  styles.toggleActive,
              ]}
              onPress={() =>
                setSfxEnabled(
                  !sfxEnabled
                )
              }
            >
              <Text
                style={[
                  styles.toggleText,

                  sfxEnabled &&
                    styles.toggleTextActive,
                ]}
              >
                {sfxEnabled
                  ? 'WŁ.'
                  : 'WYŁ.'}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          KARIERA
        </Text>

        <View style={styles.careerCard}>
          <Text style={styles.careerLine}>
            DZIEŃ {day}
          </Text>

          <Text style={styles.careerLine}>
            SERIA {streak}
          </Text>

          <Text style={styles.careerLine}>
            UKOŃCZONE MISJE{' '}
            {completedCount}
          </Text>

          <Text style={styles.careerLine}>
            POKONANI BOSSOWIE{' '}
            {bossesDefeated}
          </Text>

          <Text style={styles.careerLine}>
            ŁĄCZNE XP {xp}
          </Text>

          <Text style={styles.careerLine}>
            MONETY {coins}
          </Text>
        </View>

        {DEV_MODE && (
          <Pressable
            style={styles.resetButton}
            onPress={resetEverything}
          >
            <Text
              style={
                styles.resetButtonText
              }
            >
              RESET SYSTEMU
            </Text>
          </Pressable>
        )}
      </ScrollView>
    );
  }

  /*
    ===== OSIĄGNIĘCIA =====
  */

  if (
    screen ===
    'achievements'
  ) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentBottom
        }
      >
        <Pressable
          onPress={() =>
            setScreen('system')
          }
        >
          <Text style={styles.backText}>
            ← SYSTEM
          </Text>
        </Pressable>

        <Text style={styles.signal}>
          OSIĄGNIĘCIA
        </Text>

        <Text style={styles.largeNumber}>
          {unlockedAchievementCount}/
          {achievements.length}
        </Text>

        {achievements.map(
          (achievement) => {
            const claimed =
              claimedAchievements.includes(
                achievement.id
              );

            return (
              <View
                key={
                  achievement.id
                }
                style={[
                  styles.achievementCard,

                  achievement.unlocked &&
                    styles.achievementCardUnlocked,
                ]}
              >
                <Text
                  style={
                    styles.achievementTitle
                  }
                >
                  {achievement.unlocked
                    ? '◆ '
                    : '◇ '}
                  {achievement.title}
                </Text>

                <Text
                  style={
                    styles.achievementDescription
                  }
                >
                  {
                    achievement.description
                  }
                </Text>

                <Text
                  style={
                    styles.achievementReward
                  }
                >
                  ◈ {achievement.reward}{' '}
                  MONET
                </Text>

                {achievement.unlocked && (
                  <Pressable
                    disabled={claimed}
                    style={[
                      styles.smallActionButton,

                      claimed &&
                        styles.smallActionButtonDisabled,
                    ]}
                    onPress={() =>
                      claimAchievement(
                        achievement
                      )
                    }
                  >
                    <Text
                      style={
                        styles.smallActionButtonText
                      }
                    >
                      {claimed
                        ? 'ODEBRANO ✓'
                        : 'ODBIERZ'}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          }
        )}
      </ScrollView>
    );
  }

  /*
    ===== SKLEP =====
  */

  if (screen === 'shop') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentBottom
        }
      >
        <Pressable
          onPress={() =>
            setScreen('system')
          }
        >
          <Text style={styles.backText}>
            ← SYSTEM
          </Text>
        </Pressable>

        <Text style={styles.signal}>
          SKLEP SYSTEMU
        </Text>

        <Text style={styles.coinBalance}>
          ◈ {coins}
        </Text>

        <Text
          style={
            styles.descriptionSmall
          }
        >
          Kupuj i zakładaj
          kosmetyczne tytuły.
        </Text>

        {SHOP_ITEMS.map((item) => {
          const owned =
            ownedTitles.includes(
              item.id
            );

          const equipped =
            equippedTitle ===
            item.id;

          const unlocked =
            rankValue(rank) >=
            rankValue(
              item.requiredRank
            );

          return (
            <View
              key={item.id}
              style={styles.shopCard}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={
                    styles.shopTitle
                  }
                >
                  {item.title}
                </Text>

                <Text
                  style={
                    styles.shopMeta
                  }
                >
                  RANGA{' '}
                  {rankLabel(
                    item.requiredRank
                  )}
                  {'  ·  '}
                  ◈ {item.price}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.shopButton,

                  (!unlocked ||
                    equipped) &&
                    styles.shopButtonMuted,
                ]}
                onPress={() =>
                  buyOrEquipTitle(
                    item
                  )
                }
              >
                <Text
                  style={
                    styles.shopButtonText
                  }
                >
                  {equipped
                    ? 'ZAŁOŻONE'
                    : owned
                    ? 'ZAŁÓŻ'
                    : unlocked
                    ? 'KUP'
                    : 'BLOKADA'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  /*
    ===== HISTORIA =====
  */

  if (screen === 'history') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentBottom
        }
      >
        <Pressable
          onPress={() =>
            setScreen('system')
          }
        >
          <Text style={styles.backText}>
            ← SYSTEM
          </Text>
        </Pressable>

        <Text style={styles.signal}>
          HISTORIA MISJI
        </Text>

        <Text style={styles.largeNumber}>
          {history.length}
        </Text>

        {history.length === 0 && (
          <Text style={styles.emptyText}>
            Brak ukończonych misji.
          </Text>
        )}

        {history.map((entry) => (
          <View
            key={entry.id}
            style={[
              styles.historyCard,

              entry.boss &&
                styles.historyBossCard,
            ]}
          >
            <Text
              style={
                styles.historyDay
              }
            >
              DZIEŃ {entry.day}
              {entry.boss
                ? ' // BOSS'
                : ''}
            </Text>

            <Text
              style={
                styles.historyTitle
              }
            >
              {entry.title}
            </Text>

            <Text
              style={
                styles.historyReward
              }
            >
              +{entry.xp} XP
              {'  ·  '}
              ◈ {entry.coins}
            </Text>

            <Text
              style={
                styles.historyDate
              }
            >
              {entry.date}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  /*
    =================================
    GŁÓWNY SYSTEM
    =================================
  */

  return (
    <>
      {/*
        ===== LEVEL UP =====
      */}

      <Modal
        visible={
          levelUpVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeLevelUp
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.levelModal
            }
          >
            <Text
              style={
                styles.modalSignal
              }
            >
              ZDARZENIE SYSTEMU
            </Text>

            <Text
              style={
                styles.levelUpTitle
              }
            >
              NOWY POZIOM
            </Text>

            <Text
              style={
                styles.levelUpNumber
              }
            >
              {levelUpNumber}
            </Text>

            <Text
              style={
                styles.levelUpEvolution
              }
            >
              {
                evolutionForLevel(
                  levelUpNumber
                ).title
              }
            </Text>

            <Pressable
              style={
                styles.modalButton
              }
              onPress={
                closeLevelUp
              }
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                DALEJ
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/*
        ===== RANK UP =====
      */}

      <Modal
        visible={
          rankUpVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setRankUpVisible(false)
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.rankModal
            }
          >
            <Text
              style={
                styles.rankModalLabel
              }
            >
              AWANS RANGI
            </Text>

            <Text
              style={
                styles.rankModalValue
              }
            >
              {rankLabel(
                rankUpName
              )}
            </Text>

            <Text
              style={
                styles.rankModalSub
              }
            >
              MOC GRACZA WZROSŁA
            </Text>

            <Pressable
              style={
                styles.rankModalButton
              }
              onPress={() =>
                setRankUpVisible(
                  false
                )
              }
            >
              <Text
                style={
                  styles.rankModalButtonText
                }
              >
                POTWIERDŹ AWANS
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/*
        ===== FLASH =====
      */}

      {flashVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flash,

            {
              opacity:
                flashAnim,
            },
          ]}
        />
      )}

      {/*
        ===== POPUP NAGRODY =====
      */}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.rewardPopup,

          {
            opacity:
              rewardAnim,

            transform: [
              {
                translateY:
                  rewardAnim.interpolate(
                    {
                      inputRange: [
                        0,
                        1,
                      ],

                      outputRange: [
                        25,
                        0,
                      ],
                    }
                  ),
              },

              {
                scale:
                  rewardAnim.interpolate(
                    {
                      inputRange: [
                        0,
                        1,
                      ],

                      outputRange: [
                        0.85,
                        1,
                      ],
                    }
                  ),
              },
            ],
          },
        ]}
      >
        <Text
          style={
            styles.rewardPopupLabel
          }
        >
          NAGRODA SYSTEMU
        </Text>

        <Text
          style={
            styles.rewardPopupText
          }
        >
          {rewardText}
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.dashboardContent
        }
      >
        {/*
          ===== TOP =====
        */}

        <View style={styles.topRow}>
          <View>
            <Text style={styles.signal}>
              SYSTEM // AKTYWNY
            </Text>

            <Text
              style={
                styles.equippedTitle
              }
            >
              {equippedTitleText}
            </Text>
          </View>

          <Text style={styles.topCoins}>
            ◈ {coins}
          </Text>
        </View>

        {/*
          ===== MENU =====
        */}

        <View
          style={
            styles.navigation
          }
        >
          <Pressable
            onPress={() =>
              setScreen('profile')
            }
          >
            <Text style={styles.navText}>
              PROFIL
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setScreen(
                'achievements'
              )
            }
          >
            <Text style={styles.navText}>
              OSIĄGNIĘCIA
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setScreen('shop')
            }
          >
            <Text style={styles.navText}>
              SKLEP
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setScreen('history')
            }
          >
            <Text style={styles.navText}>
              HISTORIA
            </Text>
          </Pressable>
        </View>

        {/*
          ===== NAGŁÓWEK GRACZA =====
        */}

        <View
          style={
            styles.playerHeader
          }
        >
          <View style={{ flex: 1 }}>
            <Text
              style={
                styles.playerLabel
              }
            >
              GRACZ
            </Text>

            <Text
              style={
                styles.playerName
              }
            >
              {playerName.toUpperCase()}
            </Text>

            <Text
              style={
                styles.playerClassLine
              }
            >
              {
                CLASS_META[
                  playerClass
                ].title
              }
              {' // '}
              {evolution.title}
            </Text>
          </View>

          <View
            style={
              styles.dayBadge
            }
          >
            <Text
              style={
                styles.dayBadgeText
              }
            >
              DZIEŃ {day}
            </Text>
          </View>
        </View>

        {/*
          ===== AVATAR =====
        */}

        <AvatarCard
          avatarUri={
            displayedAvatarUri
          }
          playerClass={
            playerClass
          }
          level={level}
          rank={rankLabel(rank)}
          evolutionTitle={
            evolution.title
          }
          evolutionTier={
            evolution.tier
          }
          aura={
            evolution.aura
          }
          onEdit={() =>
            setScreen('avatar')
          }
        />

        {/*
          ===== LEVEL / RANK / POWER =====
        */}

        <View
          style={
            styles.playerStatsCard
          }
        >
          <View
            style={
              styles.playerStatsColumn
            }
          >
            <Text style={styles.infoLabel}>
              POZIOM
            </Text>

            <Text style={styles.bigStat}>
              {level}
            </Text>
          </View>

          <View
            style={
              styles.playerStatsColumn
            }
          >
            <Text style={styles.infoLabel}>
              RANGA
            </Text>

            <Text style={styles.bigRank}>
              {rankLabel(rank)}
            </Text>
          </View>

          <View
            style={
              styles.playerStatsColumn
            }
          >
            <Text style={styles.infoLabel}>
              MOC
            </Text>

            <Text style={styles.bigStat}>
              {powerScore}
            </Text>
          </View>
        </View>

        {/*
          ===== XP =====
        */}

        <View
          style={
            styles.xpLabelRow
          }
        >
          <Text style={styles.xpLabel}>
            XP POZIOMU {level}
          </Text>

          <Text style={styles.xpNumbers}>
            {currentXp}/{neededXp}
          </Text>
        </View>

        <View style={styles.xpTrack}>
          <Animated.View
            style={[
              styles.xpFill,

              {
                width:
                  xpBarAnim.interpolate(
                    {
                      inputRange: [
                        0,
                        100,
                      ],

                      outputRange: [
                        '0%',
                        '100%',
                      ],

                      extrapolate:
                        'clamp',
                    }
                  ),
              },
            ]}
          />
        </View>

        <Text
          style={
            styles.xpRemaining
          }
        >
          {Math.max(
            0,
            neededXp -
              currentXp
          )}{' '}
          XP DO POZIOMU{' '}
          {level + 1}
        </Text>

        {/*
          ===== MINI STATS =====
        */}

        <View
          style={
            styles.miniStatsRow
          }
        >
          <View
            style={
              styles.miniStatCard
            }
          >
            <Text
              style={
                styles.miniStatLabel
              }
            >
              SERIA
            </Text>

            <Text
              style={
                styles.miniStatValue
              }
            >
              🔥 {streak}
            </Text>
          </View>

          <View
            style={
              styles.miniStatCard
            }
          >
            <Text
              style={
                styles.miniStatLabel
              }
            >
              MISJE
            </Text>

            <Text
              style={
                styles.miniStatValue
              }
            >
              {completedCount}
            </Text>
          </View>

          <View
            style={
              styles.miniStatCard
            }
          >
            <Text
              style={
                styles.miniStatLabel
              }
            >
              BOSSOWIE
            </Text>

            <Text
              style={
                styles.miniStatValue
              }
            >
              {bossesDefeated}
            </Text>
          </View>
        </View>

        {/*
          ===== SKRZYNIA =====
        */}

        <Pressable
          disabled={chestClaimed}
          style={[
            styles.chestButton,

            chestClaimed &&
              styles.doneButton,
          ]}
          onPress={claimChest}
        >
          <Text
            style={
              styles.chestButtonText
            }
          >
            {chestClaimed
              ? 'DZIENNA SKRZYNIA OTWARTA ✓'
              : '◆ OTWÓRZ DZIENNĄ SKRZYNIĘ'}
          </Text>
        </Pressable>

        {/*
          ===== GŁÓWNA MISJA =====
        */}

        <Text style={styles.sectionTitle}>
          GŁÓWNA MISJA
        </Text>

        <View
          style={
            styles.mainQuestCard
          }
        >
          <Text style={styles.infoLabel}>
            CEL LEGENDARNY
          </Text>

          <Text
            style={
              styles.mainQuestTitle
            }
          >
            {goal}
          </Text>

          <View
            style={
              styles.mainQuestProgressRow
            }
          >
            <Text
              style={
                styles.mainQuestProgressLabel
              }
            >
              POSTĘP
            </Text>

            <Text
              style={
                styles.mainQuestProgressValue
              }
            >
              {mainQuestProgress}%
            </Text>
          </View>

          <View
            style={
              styles.mainQuestTrack
            }
          >
            <View
              style={[
                styles.mainQuestFill,

                {
                  width:
                    `${mainQuestProgress}%`,
                },
              ]}
            />
          </View>
        </View>
                {/*
          ===== MISJE DZIENNE =====
        */}

        <View style={styles.dailyHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              MISJE DZIENNE
            </Text>

            <Text style={styles.dailyProgressText}>
              {completedToday}/{quests.length} UKOŃCZONO
            </Text>
          </View>

          <Pressable
            style={styles.rerollButton}
            onPress={rerollQuests}
          >
            <Text style={styles.rerollButtonText}>
              ↻{' '}
              {rerolls > 0
                ? `ZMIEŃ ${rerolls}`
                : '◈ 25'}
            </Text>
          </Pressable>
        </View>

        {quests.map((quest) => (
          <View
            key={quest.id}
            style={[
              styles.questCard,
              quest.done &&
                styles.questCardDone,
            ]}
          >
            <View style={styles.questTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.questCategory}>
                  {statLabel(quest.stat)}
                </Text>

                <Text
                  style={[
                    styles.questTitle,

                    quest.done &&
                      styles.questTitleDone,
                  ]}
                >
                  {quest.title}
                </Text>
              </View>

              <View style={styles.questXpBadge}>
                <Text style={styles.questXpText}>
                  +{quest.xp} XP
                </Text>
              </View>
            </View>

            <View style={styles.questRewardRow}>
              <Text style={styles.questReward}>
                ◈ {quest.coins}
              </Text>

              <Text style={styles.questReward}>
                +{quest.statGain}{' '}
                {statLabel(quest.stat)}
              </Text>
            </View>

            <Pressable
              disabled={quest.done}
              style={[
                styles.questButton,

                quest.done &&
                  styles.questButtonDone,
              ]}
              onPress={() =>
                completeQuest(quest.id)
              }
            >
              <Text style={styles.questButtonText}>
                {quest.done
                  ? 'UKOŃCZONO ✓'
                  : 'UKOŃCZ MISJĘ'}
              </Text>
            </Pressable>
          </View>
        ))}

        {/*
          ===== BOSS =====
        */}

        {isBossDay && effectiveBoss && (
          <>
            <Text style={styles.bossSectionLabel}>
              ⚠ BRAMA BOSSA
            </Text>

            <View
              style={[
                styles.bossCard,

                effectiveBoss.done &&
                  styles.bossCardDefeated,
              ]}
            >
              <Text style={styles.bossWarning}>
                DZIEŃ {day} // BOSS
              </Text>

              <Text style={styles.bossTitle}>
                {effectiveBoss.title}
              </Text>

              <Text style={styles.bossMeta}>
                NAGRODA SPECJALNA
              </Text>

              <View style={styles.bossRewards}>
                <Text style={styles.bossRewardText}>
                  +{effectiveBoss.xp} XP
                </Text>

                <Text style={styles.bossRewardText}>
                  ◈ {effectiveBoss.coins}
                </Text>

                <Text style={styles.bossRewardText}>
                  +{effectiveBoss.statGain}{' '}
                  {statLabel(
                    effectiveBoss.stat
                  )}
                </Text>
              </View>

              {!effectiveBoss.done ? (
                <>
                  <Pressable
                    style={styles.bossIntroButton}
                    onPress={startBossIntro}
                  >
                    <Text
                      style={
                        styles.bossIntroButtonText
                      }
                    >
                      WEJDŹ DO BRAMY
                    </Text>
                  </Pressable>

                  <Pressable
                    style={
                      styles.bossCompleteButton
                    }
                    onPress={completeBoss}
                  >
                    <Text
                      style={
                        styles.bossCompleteButtonText
                      }
                    >
                      POKONAJ BOSSA
                    </Text>
                  </Pressable>
                </>
              ) : (
                <View
                  style={
                    styles.bossDefeatedBox
                  }
                >
                  <Text
                    style={
                      styles.bossDefeatedText
                    }
                  >
                    BOSS POKONANY ✓
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/*
          ===== PODSUMOWANIE DNIA =====
        */}

        <Text style={styles.sectionTitle}>
          PODSUMOWANIE DNIA
        </Text>

        <View style={styles.daySummaryCard}>
          <View style={styles.daySummaryRow}>
            <Text style={styles.daySummaryLabel}>
              MISJE
            </Text>

            <Text style={styles.daySummaryValue}>
              {completedToday}/{quests.length}
            </Text>
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.daySummaryRow}>
            <Text style={styles.daySummaryLabel}>
              BOSS
            </Text>

            <Text style={styles.daySummaryValue}>
              {!isBossDay
                ? 'BRAK'
                : effectiveBoss?.done
                ? 'POKONANY'
                : 'AKTYWNY'}
            </Text>
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.daySummaryRow}>
            <Text style={styles.daySummaryLabel}>
              STATUS
            </Text>

            <Text
              style={[
                styles.daySummaryValue,

                allDayDone &&
                  styles.daySummaryComplete,
              ]}
            >
              {allDayDone
                ? 'UKOŃCZONY'
                : 'W TOKU'}
            </Text>
          </View>
        </View>

        {/*
          ===== NAGRODA ZA DZIEŃ =====
        */}

        <Pressable
          disabled={
            !allDayDone ||
            dayRewardClaimed
          }
          style={[
            styles.dayRewardButton,

            (!allDayDone ||
              dayRewardClaimed) &&
              styles.disabledButton,
          ]}
          onPress={claimDayReward}
        >
          <Text
            style={
              styles.dayRewardButtonText
            }
          >
            {dayRewardClaimed
              ? 'NAGRODA ZA DZIEŃ ODEBRANA ✓'
              : allDayDone
              ? 'ODBIERZ NAGRODĘ ZA DZIEŃ'
              : 'UKOŃCZ WSZYSTKIE MISJE'}
          </Text>
        </Pressable>

        {/*
          ===== NASTĘPNY DZIEŃ =====
        */}

        <Pressable
          disabled={!canStartNewDay}
          style={[
            styles.nextDayButton,

            !canStartNewDay &&
              styles.disabledButton,
          ]}
          onPress={() =>
            startNewDay(false)
          }
        >
          <Text
            style={
              styles.nextDayButtonText
            }
          >
            ROZPOCZNIJ DZIEŃ {day + 1} →
          </Text>
        </Pressable>

        {/*
          ===== DEV MODE =====
        */}

        {DEV_MODE && (
          <View style={styles.devCard}>
            <Text style={styles.devTitle}>
              SYSTEM // TRYB TESTOWY
            </Text>

            <Text style={styles.devText}>
              QUESTY: LOKALNIE
            </Text>

            <Text style={styles.devText}>
              AVATAR: C2 BACKEND
            </Text>

            <Text style={styles.devText}>
              SERWER: {AVATAR_API_URL}
            </Text>

            <Text style={styles.devText}>
              KATEGORIA: {category}
            </Text>

            <Pressable
              style={styles.devButton}
              onPress={() =>
                startNewDay(true)
              }
            >
              <Text style={styles.devButtonText}>
                TEST: NASTĘPNY DZIEŃ
              </Text>
            </Pressable>

            <Pressable
              style={styles.resetButton}
              onPress={resetEverything}
            >
              <Text style={styles.resetButtonText}>
                RESET SYSTEMU
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.footerText}>
          SYSTEM // DZIEŃ {day} // RANGA{' '}
          {rankLabel(rank)}
        </Text>
      </ScrollView>
    </>
  );
}

/*
  ==========================================
  STYLE SYSTEMU
  ==========================================
*/

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#05070A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    marginTop: 18,
    color: '#7CEBFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },

  container: {
    flex: 1,
    backgroundColor: '#05070A',
    paddingHorizontal: 18,
    paddingTop: 22,
  },

  contentBottom: {
    paddingBottom: 70,
  },

  dashboardContent: {
    paddingBottom: 100,
  },

  welcomeCenter: {
    flex: 1,
    justifyContent: 'center',
  },

  signal: {
    color: '#00D9FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.4,
    marginBottom: 12,
  },

  bigTitle: {
    color: '#F3F8FA',
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900',
    letterSpacing: -1.5,
  },

  screenTitle: {
    color: '#F4F8FA',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 15,
  },

  description: {
    color: '#85939B',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    marginBottom: 25,
  },

  descriptionSmall: {
    color: '#829097',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },

  infoCard: {
    backgroundColor: '#0B1015',
    borderWidth: 1,
    borderColor: '#19252D',
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
  },

  infoLabel: {
    color: '#65747D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
  },

  infoValueBlue: {
    color: '#00D9FF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 5,
  },

  infoValue: {
    color: '#D8E1E5',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: '#172229',
    marginVertical: 16,
  },

  primaryButton: {
    minHeight: 58,
    backgroundColor: '#00D9FF',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    paddingHorizontal: 18,
  },

  primaryButtonInline: {
    minHeight: 58,
    backgroundColor: '#00D9FF',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    paddingHorizontal: 18,
  },

  primaryButtonText: {
    color: '#021015',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.1,
    textAlign: 'center',
  },

  disabledButton: {
    opacity: 0.3,
  },

  identityPhoto: {
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0A1015',
    borderWidth: 1,
    borderColor: '#21323B',
  },

  identityPhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  identityPhotoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  identityPhotoIcon: {
    color: '#00D9FF',
    fontSize: 44,
    marginBottom: 12,
  },

  identityPhotoText: {
    color: '#C9D6DB',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  photoButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 25,
  },

  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0C141A',
    borderWidth: 1,
    borderColor: '#25343C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#9EC6D1',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  fieldLabel: {
    color: '#75858E',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginTop: 16,
    marginBottom: 8,
  },

  inputSmall: {
    minHeight: 54,
    backgroundColor: '#0B1116',
    borderWidth: 1,
    borderColor: '#203039',
    borderRadius: 12,
    paddingHorizontal: 15,
    color: '#F5F8F9',
    fontSize: 16,
  },

  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },

  difficultyButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#23313A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0F13',
  },

  difficultyButtonActive: {
    borderColor: '#00D9FF',
    backgroundColor: '#08202A',
  },

  difficultyText: {
    color: '#64747D',
    fontWeight: '900',
    fontSize: 10,
  },

  difficultyTextActive: {
    color: '#00D9FF',
  },

  helpText: {
    color: '#5E6D75',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },

  classCard: {
    flexDirection: 'row',
    backgroundColor: '#0A1015',
    borderWidth: 1,
    borderColor: '#17242B',
    borderRadius: 16,
    padding: 15,
    marginBottom: 11,
  },

  classCardActive: {
    borderColor: '#00D9FF',
    backgroundColor: '#081922',
  },

  classGlyphBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#101A20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  classGlyph: {
    color: '#00D9FF',
    fontSize: 29,
    fontWeight: '900',
  },

  classTextArea: {
    flex: 1,
  },

  classTitle: {
    color: '#F0F5F7',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  classSubtitle: {
    color: '#00D9FF',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
    marginBottom: 5,
  },

  classDescription: {
    color: '#76868F',
    fontSize: 12,
    lineHeight: 18,
  },

  goalInput: {
    minHeight: 165,
    backgroundColor: '#0A1015',
    borderWidth: 1,
    borderColor: '#22323B',
    borderRadius: 16,
    color: '#F0F5F7',
    padding: 16,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
  },

  backText: {
    color: '#00D9FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 25,
  },

  profileName: {
    color: '#F6F9FA',
    fontSize: 30,
    fontWeight: '900',
  },

  profileSubtitle: {
    color: '#00D9FF',
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 18,
  },

  profileSummary: {
    flexDirection: 'row',
    backgroundColor: '#0B1015',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#17252D',
    paddingVertical: 16,
    marginTop: 15,
  },

  profileSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  profileSummaryValue: {
    color: '#F2F7F9',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 4,
  },

  profileRankValue: {
    color: '#00D9FF',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 4,
  },

  sectionTitle: {
    color: '#B6C4CA',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 28,
    marginBottom: 12,
  },

  statRow: {
    height: 50,
    backgroundColor: '#0A1015',
    borderBottomWidth: 1,
    borderBottomColor: '#172129',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },

  statName: {
    color: '#7D8D95',
    fontSize: 11,
    fontWeight: '900',
  },

  statValue: {
    color: '#00D9FF',
    fontSize: 17,
    fontWeight: '900',
  },

  settingsCard: {
    backgroundColor: '#0A1015',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#18262E',
    paddingHorizontal: 15,
  },

  settingRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  settingTitle: {
    color: '#DCE5E8',
    fontSize: 13,
    fontWeight: '900',
  },

  settingDescription: {
    color: '#64747C',
    fontSize: 11,
    marginTop: 3,
  },

  settingDivider: {
    height: 1,
    backgroundColor: '#172229',
  },

  toggle: {
    minWidth: 60,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#151D22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleActive: {
    backgroundColor: '#073B48',
    borderWidth: 1,
    borderColor: '#00D9FF',
  },

  toggleText: {
    color: '#66757C',
    fontSize: 10,
    fontWeight: '900',
  },

  toggleTextActive: {
    color: '#00D9FF',
  },

  careerCard: {
    backgroundColor: '#0A1015',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#18252D',
    padding: 17,
    gap: 9,
  },

  careerLine: {
    color: '#B1BFC5',
    fontSize: 12,
    fontWeight: '800',
  },

  largeNumber: {
    color: '#F4F8F9',
    fontSize: 45,
    fontWeight: '900',
    marginBottom: 18,
  },

  achievementCard: {
    backgroundColor: '#0A1015',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#172229',
    padding: 16,
    marginBottom: 10,
    opacity: 0.55,
  },

  achievementCardUnlocked: {
    borderColor: '#00D9FF',
    opacity: 1,
  },

  achievementTitle: {
    color: '#E8EFF1',
    fontSize: 14,
    fontWeight: '900',
  },

  achievementDescription: {
    color: '#74838B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  achievementReward: {
    color: '#F2C94C',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 10,
  },

  smallActionButton: {
    height: 40,
    backgroundColor: '#00D9FF',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  smallActionButtonDisabled: {
    opacity: 0.35,
  },

  smallActionButtonText: {
    color: '#031116',
    fontSize: 11,
    fontWeight: '900',
  },

  coinBalance: {
    color: '#F2C94C',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 8,
  },

  shopCard: {
    minHeight: 80,
    backgroundColor: '#0A1015',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#17242C',
    padding: 14,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  shopTitle: {
    color: '#E7EEF0',
    fontSize: 14,
    fontWeight: '900',
  },

  shopMeta: {
    color: '#6C7D85',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },

  shopButton: {
    minWidth: 76,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  shopButtonMuted: {
    backgroundColor: '#182229',
  },

  shopButtonText: {
    color: '#041116',
    fontSize: 10,
    fontWeight: '900',
  },

  emptyText: {
    color: '#65747C',
    fontSize: 13,
  },

  historyCard: {
    backgroundColor: '#0A1015',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#17232A',
    padding: 15,
    marginBottom: 9,
  },

  historyBossCard: {
    borderColor: '#A94EFF',
    backgroundColor: '#120C19',
  },

  historyDay: {
    color: '#00D9FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  historyTitle: {
    color: '#E5ECEE',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },

  historyReward: {
    color: '#F2C94C',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 8,
  },

  historyDate: {
    color: '#53646C',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 7,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  levelModal: {
    width: '100%',
    backgroundColor: '#071017',
    borderWidth: 1,
    borderColor: '#00D9FF',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
  },

  modalSignal: {
    color: '#00D9FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  levelUpTitle: {
    color: '#F4F8F9',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 18,
  },

  levelUpNumber: {
    color: '#00D9FF',
    fontSize: 80,
    lineHeight: 90,
    fontWeight: '900',
  },

  levelUpEvolution: {
    color: '#9DB0B8',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 22,
  },

  modalButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalButtonText: {
    color: '#021115',
    fontWeight: '900',
  },

  rankModal: {
    width: '100%',
    backgroundColor: '#110A17',
    borderWidth: 1,
    borderColor: '#AA4EFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
  },

  rankModalLabel: {
    color: '#C48AFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  rankModalValue: {
    color: '#E4C5FF',
    fontSize: 72,
    fontWeight: '900',
    marginVertical: 12,
  },

  rankModalSub: {
    color: '#9886A5',
    fontWeight: '800',
    marginBottom: 20,
  },

  rankModalButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: '#A94EFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rankModalButtonText: {
    color: '#100517',
    fontWeight: '900',
  },

  flash: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
  },

  rewardPopup: {
    position: 'absolute',
    zIndex: 900,
    top: 60,
    left: 25,
    right: 25,
    backgroundColor: '#07141A',
    borderWidth: 1,
    borderColor: '#00D9FF',
    borderRadius: 12,
    padding: 14,
  },

  rewardPopupLabel: {
    color: '#00D9FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
    textAlign: 'center',
  },

  rewardPopupText: {
    color: '#DFF8FF',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 5,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  equippedTitle: {
    color: '#86969E',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  topCoins: {
    color: '#F2C94C',
    fontSize: 17,
    fontWeight: '900',
  },

  navigation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 17,
    marginBottom: 22,
  },

  navText: {
    color: '#86A0AA',
    backgroundColor: '#0B1217',
    borderWidth: 1,
    borderColor: '#1B2A32',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
    fontSize: 9,
    fontWeight: '900',
  },

  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  playerLabel: {
    color: '#65757E',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  playerName: {
    color: '#F5F8F9',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 2,
  },

  playerClassLine: {
    color: '#00D9FF',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },

  dayBadge: {
    backgroundColor: '#0A1D24',
    borderWidth: 1,
    borderColor: '#00D9FF',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  dayBadgeText: {
    color: '#00D9FF',
    fontSize: 10,
    fontWeight: '900',
  },

  playerStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#0A1015',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#18262E',
    paddingVertical: 14,
    marginTop: 12,
  },

  playerStatsColumn: {
    flex: 1,
    alignItems: 'center',
  },

  bigStat: {
    color: '#EDF3F5',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },

  bigRank: {
    color: '#00D9FF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },

  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 17,
  },

  xpLabel: {
    color: '#75868F',
    fontSize: 10,
    fontWeight: '900',
  },

  xpNumbers: {
    color: '#A7BBC3',
    fontSize: 10,
    fontWeight: '900',
  },

  xpTrack: {
    height: 7,
    backgroundColor: '#111B20',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 7,
  },

  xpFill: {
    height: '100%',
    backgroundColor: '#00D9FF',
    borderRadius: 10,
  },

  xpRemaining: {
    color: '#51636B',
    fontSize: 9,
    textAlign: 'right',
    marginTop: 5,
    fontWeight: '800',
  },

  miniStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },

  miniStatCard: {
    flex: 1,
    backgroundColor: '#0A1015',
    borderWidth: 1,
    borderColor: '#17252D',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },

  miniStatLabel: {
    color: '#596B74',
    fontSize: 8,
    fontWeight: '900',
  },

  miniStatValue: {
    color: '#DDE6E9',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 3,
  },

  chestButton: {
    height: 49,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#C7922E',
    backgroundColor: '#1A1408',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  chestButtonText: {
    color: '#F2C94C',
    fontSize: 11,
    fontWeight: '900',
  },

  doneButton: {
    opacity: 0.4,
  },

  mainQuestCard: {
    backgroundColor: '#0B1116',
    borderWidth: 1,
    borderColor: '#31404A',
    borderRadius: 15,
    padding: 17,
  },

  mainQuestTitle: {
    color: '#ECF2F4',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 7,
  },

  mainQuestProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 17,
  },

  mainQuestProgressLabel: {
    color: '#65777F',
    fontSize: 9,
    fontWeight: '900',
  },

  mainQuestProgressValue: {
    color: '#00D9FF',
    fontSize: 10,
    fontWeight: '900',
  },

  mainQuestTrack: {
    height: 6,
    backgroundColor: '#152026',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 6,
  },

  mainQuestFill: {
    height: '100%',
    backgroundColor: '#00D9FF',
  },

  dailyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  dailyProgressText: {
    color: '#64757D',
    fontSize: 10,
    fontWeight: '800',
    marginTop: -7,
    marginBottom: 12,
  },

  rerollButton: {
    borderWidth: 1,
    borderColor: '#273841',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginBottom: 10,
  },

  rerollButtonText: {
    color: '#84B8C5',
    fontSize: 9,
    fontWeight: '900',
  },

  questCard: {
    backgroundColor: '#0A1015',
    borderWidth: 1,
    borderColor: '#18252C',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },

  questCardDone: {
    borderColor: '#174A3A',
    backgroundColor: '#08130F',
    opacity: 0.7,
  },

  questTopRow: {
    flexDirection: 'row',
    gap: 10,
  },

  questCategory: {
    color: '#00D9FF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  questTitle: {
    color: '#E5ECEF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
    marginTop: 5,
  },

  questTitleDone: {
    color: '#6D877C',
  },

  questXpBadge: {
    backgroundColor: '#09202A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },

  questXpText: {
    color: '#00D9FF',
    fontSize: 9,
    fontWeight: '900',
  },

  questRewardRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 12,
  },

  questReward: {
    color: '#9AAAB1',
    fontSize: 10,
    fontWeight: '800',
  },

  questButton: {
    height: 42,
    backgroundColor: '#00D9FF',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  questButtonDone: {
    backgroundColor: '#183027',
  },

  questButtonText: {
    color: '#031116',
    fontSize: 11,
    fontWeight: '900',
  },

  bossSectionLabel: {
    color: '#DB72FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 28,
    marginBottom: 10,
  },

  bossCard: {
    backgroundColor: '#130A19',
    borderWidth: 1,
    borderColor: '#A94EFF',
    borderRadius: 16,
    padding: 18,
  },

  bossCardDefeated: {
    borderColor: '#2A644C',
    backgroundColor: '#08140F',
  },

  bossWarning: {
    color: '#D074FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  bossTitle: {
    color: '#F0DFFF',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginTop: 9,
  },

  bossMeta: {
    color: '#9274A0',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 15,
  },

  bossRewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 7,
  },

  bossRewardText: {
    color: '#F2C94C',
    fontSize: 10,
    fontWeight: '900',
  },

  bossIntroButton: {
    height: 46,
    borderWidth: 1,
    borderColor: '#A94EFF',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  bossIntroButtonText: {
    color: '#CB91FF',
    fontSize: 11,
    fontWeight: '900',
  },

  bossCompleteButton: {
    height: 48,
    backgroundColor: '#A94EFF',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
  },

  bossCompleteButtonText: {
    color: '#120519',
    fontSize: 11,
    fontWeight: '900',
  },

  bossDefeatedBox: {
    height: 48,
    borderRadius: 9,
    backgroundColor: '#153629',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  bossDefeatedText: {
    color: '#62D99B',
    fontSize: 12,
    fontWeight: '900',
  },

  daySummaryCard: {
    backgroundColor: '#0A1015',
    borderWidth: 1,
    borderColor: '#17242C',
    borderRadius: 14,
    paddingHorizontal: 15,
  },

  daySummaryRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  daySummaryLabel: {
    color: '#687981',
    fontSize: 10,
    fontWeight: '900',
  },

  daySummaryValue: {
    color: '#D5E0E4',
    fontSize: 11,
    fontWeight: '900',
  },

  daySummaryComplete: {
    color: '#62D99B',
  },

  dayRewardButton: {
    height: 52,
    borderRadius: 11,
    backgroundColor: '#F2C94C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  dayRewardButtonText: {
    color: '#171204',
    fontSize: 11,
    fontWeight: '900',
  },

  nextDayButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  nextDayButtonText: {
    color: '#021116',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  devCard: {
    backgroundColor: '#080D10',
    borderWidth: 1,
    borderColor: '#252E33',
    borderRadius: 12,
    padding: 14,
    marginTop: 30,
  },

  devTitle: {
    color: '#71848D',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  devText: {
    color: '#485960',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },

  devButton: {
    height: 38,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#34444C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  devButtonText: {
    color: '#8198A2',
    fontSize: 9,
    fontWeight: '900',
  },

  resetButton: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#713039',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 10,
  },

  resetButtonText: {
    color: '#D46672',
    fontSize: 9,
    fontWeight: '900',
  },

  footerText: {
    color: '#33444B',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.2,
    marginTop: 25,
  },
});