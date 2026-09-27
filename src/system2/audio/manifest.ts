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
export const LEGACY_AUDIO_FALLBACKS={
  music:{
    HOME:{id:'music.home.fallback',kind:'music',source:require('../../../assets/audio/music/home.wav'),loop:true,placeholder:false,recommendedReplacement:'HOME 3 theme'},
    WORLD:{id:'music.world.fallback',kind:'music',source:require('../../../assets/audio/music/world.mp3'),loop:true,placeholder:false,recommendedReplacement:'WORLD theme'},
    QUEST:{id:'music.quest.fallback',kind:'music',source:require('../../../assets/audio/dashboard_ambient.mp3'),loop:true,placeholder:true,recommendedReplacement:'quest briefing tension loop'},
    ACTIVE_QUEST:{id:'music.active.fallback',kind:'music',source:require('../../../assets/audio/dashboard_ambient.mp3'),loop:true,placeholder:true,recommendedReplacement:'active quest pulse / orchestral hybrid'},
    BOSS:{id:'music.boss.fallback',kind:'music',source:require('../../../assets/audio/boss_theme.mp3'),loop:true,placeholder:true,recommendedReplacement:'heavy orchestral boss theme'},
    VICTORY:{id:'music.victory.fallback',kind:'music',source:require('../../../assets/audio/quest_complete.mp3'),loop:false,placeholder:true,recommendedReplacement:'short victory fanfare'},
    AWAKENING:{id:'music.awakening.fallback',kind:'music',source:require('../../../assets/audio/boss_theme.mp3'),loop:false,placeholder:true,recommendedReplacement:'awakening cinematic launch theme'},
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
