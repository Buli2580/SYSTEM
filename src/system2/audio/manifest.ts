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
    HOME:{id:'music.home.fallback',kind:'music',source:require('../../../assets/audio/dashboard_ambient.mp3'),loop:true,placeholder:true,recommendedReplacement:'dark fantasy home/world orchestral loop'},
    WORLD:{id:'music.world.fallback',kind:'music',source:require('../../../assets/audio/dashboard_ambient.mp3'),loop:true,placeholder:true,recommendedReplacement:'exploration/world cinematic loop'},
    QUEST:{id:'music.quest.fallback',kind:'music',source:require('../../../assets/audio/dashboard_ambient.mp3'),loop:true,placeholder:true,recommendedReplacement:'quest briefing tension loop'},
    ACTIVE_QUEST:{id:'music.active.fallback',kind:'music',source:require('../../../assets/audio/dashboard_ambient.mp3'),loop:true,placeholder:true,recommendedReplacement:'active quest pulse / orchestral hybrid'},
    BOSS:{id:'music.boss.fallback',kind:'music',source:require('../../../assets/audio/boss_theme.mp3'),loop:true,placeholder:true,recommendedReplacement:'heavy orchestral boss theme'},
    VICTORY:{id:'music.victory.fallback',kind:'music',source:require('../../../assets/audio/quest_complete.mp3'),loop:false,placeholder:true,recommendedReplacement:'short victory fanfare'},
    AWAKENING:{id:'music.awakening.fallback',kind:'music',source:require('../../../assets/audio/boss_theme.mp3'),loop:false,placeholder:true,recommendedReplacement:'awakening cinematic launch theme'},
  },
  sfx:{
    QUEST_START:{id:'sfx.quest_start.fallback',kind:'sfx',source:require('../../../assets/audio/quest_start.wav'),loop:false,placeholder:true,recommendedReplacement:'quest accept impact'},
    REWARD:{id:'sfx.reward.fallback',kind:'sfx',source:require('../../../assets/audio/quest_complete.mp3'),loop:false,placeholder:true,recommendedReplacement:'reward reveal sting'},
    LEVEL_UP:{id:'sfx.level_up.fallback',kind:'sfx',source:require('../../../assets/audio/level_up.mp3'),loop:false,placeholder:true,recommendedReplacement:'level up rise'},
    ERROR:{id:'sfx.error.fallback',kind:'sfx',source:require('../../../assets/audio/quest_error.wav'),loop:false,placeholder:true,recommendedReplacement:'system error hit'},
  },
} as const;
