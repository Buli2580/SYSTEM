export type AudioAssetKind='music'|'ambient'|'sfx';

export type AudioAssetDescriptor={
  id:string;
  kind:AudioAssetKind;
  source:any;
  loop:boolean;
  placeholder:boolean;
  recommendedReplacement:string;
};

// Legacy files stay isolated here only as technical fallbacks.
// Production assets can replace any entry without touching the audio engine.
export const DARK_FANTASY_SOUNDTRACK_MAP={
  HOME:{mood:'dark ambient / low drones / restrained pulse',target:'calm living world'},
  WORLD:{mood:'dark fantasy exploration / strings / distant choir',target:'world exploration'},
  QUEST:{mood:'cinematic tension / low percussion',target:'briefing and verification'},
  ACTIVE_QUEST:{mood:'hybrid pulse / percussion / sub bass',target:'movement and action'},
  BOSS:{mood:'dark orchestral battle / huge drums / choir / sub impacts',target:'boss combat'},
  AWAKENING:{mood:'slow rise / choir / energy / cinematic drop',target:'awakening reveal'},
  VICTORY:{mood:'short heroic dark-fantasy resolve',target:'reward and completion'},
} as const;

export const CINEMATIC_AUDIO_ASSET_PLAN={
  layers:['city_ruins_ambient','fire_loop','wind_loop','rain_loop','storm_loop','portal_energy_loop'],
  events:['ogre_step_01','ogre_step_02','ogre_roar_01','building_hit_01','concrete_debris_01','thunder_01','bass_impact_01','boss_enter','awakening_enter'],
  sourcePolicy:'Only commit audio with verified redistribution/use rights; keep license/source metadata beside imported assets.',
} as const;

export const LEGACY_AUDIO_FALLBACKS={
  music:{
    HOME:{id:'music.home.fallback',kind:'music',source:require('../../../assets/audio/music/home.wav'),loop:true,placeholder:false,recommendedReplacement:'SYSTEM HOME soundtrack'},
    WORLD:{id:'music.world.fallback',kind:'music',source:require('../../../assets/audio/music/world.mp3'),loop:true,placeholder:false,recommendedReplacement:'SYSTEM WORLD soundtrack'},
    QUEST:{id:'music.quest.fallback',kind:'music',source:require('../../../assets/audio/music/quest.mp3'),loop:true,placeholder:false,recommendedReplacement:'SYSTEM QUEST soundtrack'},
    ACTIVE_QUEST:{id:'music.active.fallback',kind:'music',source:require('../../../assets/audio/music/active_quest.mp3'),loop:true,placeholder:false,recommendedReplacement:'SYSTEM ACTIVE QUEST soundtrack'},
    BOSS:{id:'music.boss.fallback',kind:'music',source:require('../../../assets/audio/music/boss.mp3'),loop:true,placeholder:false,recommendedReplacement:'SYSTEM BOSS soundtrack'},
    VICTORY:{id:'music.victory.fallback',kind:'music',source:require('../../../assets/audio/music/victory.mp3'),loop:false,placeholder:false,recommendedReplacement:'SYSTEM VICTORY soundtrack'},
    AWAKENING:{id:'music.awakening.fallback',kind:'music',source:require('../../../assets/audio/music/awakening.mp3'),loop:false,placeholder:false,recommendedReplacement:'SYSTEM AWAKENING soundtrack'},
  },
  cinematic:{
    layers:{
      CITY_RUINS:{source:require('../../../assets/audio/dashboard_ambient.mp3'),volume:.30},
      FIRE:{source:require('../../../assets/audio/dashboard_ambient.mp3'),volume:.16},
      WIND:{source:require('../../../assets/audio/dashboard_ambient.mp3'),volume:.18},
      RAIN:{source:require('../../../assets/audio/dashboard_ambient.mp3'),volume:.20},
      STORM:{source:require('../../../assets/audio/boss_theme.mp3'),volume:.16},
      PORTAL_ENERGY:{source:require('../../../assets/audio/system_wake.wav'),volume:.12},
    },
    events:{
      OGRE_STEP:{source:require('../../../assets/audio/error.wav'),volume:.70},
      OGRE_ROAR:{source:require('../../../assets/audio/boss_theme.mp3'),volume:.55},
      BUILDING_HIT:{source:require('../../../assets/audio/error.wav'),volume:.90},
      DEBRIS:{source:require('../../../assets/audio/error.wav'),volume:.42},
      THUNDER:{source:require('../../../assets/audio/error.wav'),volume:.72},
      PORTAL_ENERGY:{source:require('../../../assets/audio/system_wake.wav'),volume:.52},
      BASS_IMPACT:{source:require('../../../assets/audio/error.wav'),volume:1},
      BOSS_ENTER:{source:require('../../../assets/audio/boss_theme.mp3'),volume:.90},
      AWAKENING_ENTER:{source:require('../../../assets/audio/system_wake.wav'),volume:.85},
      BOSS_ATTACK:{source:require('../../../assets/audio/error.wav'),volume:.92},
      BOSS_HIT:{source:require('../../../assets/audio/error.wav'),volume:.86},
      BOSS_PHASE_2:{source:require('../../../assets/audio/boss_theme.mp3'),volume:.78},
      BOSS_ENRAGE:{source:require('../../../assets/audio/boss_theme.mp3'),volume:.90},
      BOSS_DEATH:{source:require('../../../assets/audio/error.wav'),volume:.88},
      VICTORY:{source:require('../../../assets/audio/quest_complete.mp3'),volume:.82},
      AWAKENING_RISE:{source:require('../../../assets/audio/system_wake.wav'),volume:.60},
      AWAKENING_FLASH:{source:require('../../../assets/audio/system_wake.wav'),volume:.72},
      AWAKENING_COMPLETE:{source:require('../../../assets/audio/quest_complete.mp3'),volume:.86},
    },
  },
  sfx:{
    UI_TAP:{id:'sfx.ui',kind:'sfx',source:require('../../../assets/audio/ui_tap.wav'),loop:false,placeholder:false,recommendedReplacement:'SYSTEM UI tap'},
    SCAN:{id:'sfx.scan',kind:'sfx',source:require('../../../assets/audio/system_wake.wav'),loop:false,placeholder:false,recommendedReplacement:'SYSTEM wake / scan'},
    QUEST_START:{id:'sfx.quest_start',kind:'sfx',source:require('../../../assets/audio/quest_start.wav'),loop:false,placeholder:false,recommendedReplacement:'quest accept impact'},
    VERIFY:{id:'sfx.verify',kind:'sfx',source:require('../../../assets/audio/verify.wav'),loop:false,placeholder:false,recommendedReplacement:'verification lock'},
    REWARD:{id:'sfx.reward',kind:'sfx',source:require('../../../assets/audio/quest_complete.mp3'),loop:false,placeholder:false,recommendedReplacement:'reward reveal sting'},
    XP:{id:'sfx.xp',kind:'sfx',source:require('../../../assets/audio/xp_gain.wav'),loop:false,placeholder:false,recommendedReplacement:'XP gain pulse'},
    LEVEL_UP:{id:'sfx.level_up',kind:'sfx',source:require('../../../assets/audio/level_up.mp3'),loop:false,placeholder:false,recommendedReplacement:'level up rise'},
    RANK_UP:{id:'sfx.rank_up',kind:'sfx',source:require('../../../assets/audio/level_up.mp3'),loop:false,placeholder:false,recommendedReplacement:'rank ascension sting'},
    PORTAL:{id:'sfx.portal',kind:'sfx',source:require('../../../assets/audio/system_wake.wav'),loop:false,placeholder:false,recommendedReplacement:'portal / awakening impact'},
    BOSS_HIT:{id:'sfx.boss_hit',kind:'sfx',source:require('../../../assets/audio/error.wav'),loop:false,placeholder:false,recommendedReplacement:'heavy boss impact'},
    ERROR:{id:'sfx.error',kind:'sfx',source:require('../../../assets/audio/error.wav'),loop:false,placeholder:false,recommendedReplacement:'system error hit'},
  },
} as const;
