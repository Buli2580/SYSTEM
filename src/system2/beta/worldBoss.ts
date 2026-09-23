export type WorldBossMode='SEALED'|'DISCOVERY'|'BOSS'|'AFTERMATH';
export function worldBossMode(i:{worldUnlocked:boolean;bossActive:boolean;bossDefeated:boolean}):WorldBossMode{if(!i.worldUnlocked)return 'SEALED';if(i.bossDefeated)return 'AFTERMATH';if(i.bossActive)return 'BOSS';return 'DISCOVERY';}
