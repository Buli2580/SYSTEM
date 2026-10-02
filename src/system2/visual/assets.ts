// Local Metro asset IDs register metadata; images decode only when mounted.
// Retired RC2 entries deliberately resolve to native placeholders. Never require missing files.
export const ART = {
  bootVoid: require('../../../assets/visual/rc3/SYSTEM_RC3_ASSETS_20/intro/02_boot_void.webp') as number,
  systemEmblem: require('../../../assets/visual/rc3/SYSTEM_RC3_ASSETS_20/intro/01_system_emblem.webp') as number,
  bootPortal: require('../../../assets/visual/rc3/SYSTEM_RC3_ASSETS_20/intro/03_boot_portal.webp') as number,
  worldReveal: require('../../../assets/visual/rc3/SYSTEM_RC3_ASSETS_20/intro/04_world_reveal.webp') as number,
  firstAwakening: require('../../../assets/visual/rc3/SYSTEM_RC3_ASSETS_20/intro/05_first_awakening.webp') as number,
  avatarNeutral: require('../../../assets/visual/rc3/SYSTEM_RC3_ASSETS_20/character/09_avatar_neutral.webp') as number,
  privateDomain: require('../../../assets/visual/rc3/SYSTEM_RC3_ASSETS_20/home/10_private_domain.webp') as number,
  characterSelection: require('../../../assets/visual/rc3/SYSTEM_RC3_ASSETS_20/character/11_character_selection.webp') as number,
  intro: undefined,
  home: undefined,
  boss: undefined,
  run: undefined,
  strength: undefined,
  study: undefined,
  social: undefined,
  walk: undefined,
  cycle: undefined,
  food: undefined,
  creative: undefined,
  pets: undefined,
  car: undefined,
  travel: undefined,
  focus: undefined,
  homeCategory: undefined,
  entertainment: undefined,
  jacket: undefined,
  ring: undefined,
  pendant: undefined,
  tool: undefined,
  electronics: undefined,
  badgeQuest: undefined,
  badgeStreak: undefined,
  badgeBoss: undefined,
  badgeWorld: undefined,
  badgeProgress: undefined,
  badgeSpecial: undefined,
  mapSignal: undefined,
  xp: undefined,
  levelUp: undefined,
  aura: undefined,
  core: undefined,
  character01: undefined,
  character02: undefined,
  character03: undefined,
  character04: undefined,
  character05: undefined,
  character06: undefined,
  character07: undefined,
  character08: undefined,
  character09: undefined,
  character10: undefined,
  character11: undefined,
  character12: undefined,
  character13: undefined,
  character14: undefined,
  character15: undefined,
} as const;

// Selection uses existing semantic data, never quest IDs, reward calculation or random state.
export function questArt(q: {category: string; primarySkill: string; activityType?: string; arc?: string}) {
  if (q.category === 'BOSS') return ART.boss;
  if (q.arc === 'AWAKENING') return ART.firstAwakening;
  if (q.activityType === 'RUN') return ART.run;
  if (q.activityType === 'BIKE') return ART.cycle;
  if (q.activityType === 'WALK') return ART.walk;
  const skills: Record<string, number | undefined> = {STR:ART.strength,VIT:ART.walk,INT:ART.study,WIL:ART.focus,CHA:ART.social,CRE:ART.creative,RES:ART.focus};
  return skills[q.primarySkill] ?? ART.focus;
}
// No RC3 evolution variants yet; identity, equipment and progression stay unchanged.
export function characterArt(_style: string, _stage: number) { return ART.avatarNeutral; }
export function bootArt(phase?: string) {
  const phases: Record<string, number> = {ONLINE:ART.bootVoid,DETECTED:ART.systemEmblem,AWAKENING:ART.bootPortal,WORLD:ART.worldReveal};
  return phases[phase ?? ''] ?? ART.bootVoid;
}
const ITEM_ART: Record<string, number | undefined> = {
  'relic-origin-shard':ART.badgeProgress,'badge-first-wall':ART.badgeBoss,
  'frame-night-runner':ART.badgeQuest,'aura-iron-titan':ART.aura,
  'cosmetic-oracle-glyph':ART.badgeSpecial,'relic-ascendant-core':ART.core,
  WEAPON:ART.tool,ARMOR:ART.jacket,RING:ART.ring,RELIC:ART.pendant,
};
export function itemArt(item: {id?: string; slot?: string}) {return ITEM_ART[item.id ?? ''] ?? ITEM_ART[item.slot ?? ''];}
export function achievementArt(category: string) {
  const categories: Record<string, number | undefined> = {QUESTS:ART.badgeQuest,EXPLORATION:ART.badgeWorld,CONSISTENCY:ART.badgeStreak,PROGRESSION:ART.badgeProgress,BOSSES:ART.badgeBoss,FIELD_ACTIVITY:ART.badgeWorld,SPECIAL:ART.badgeSpecial};
  return categories[category] ?? ART.badgeQuest;
}
export const MARKET_CATEGORIES = [
  {id:'sport',label:'Sport',art:ART.strength},
  {id:'food',label:'Żywność',art:ART.food},
  {id:'electronics',label:'Elektronika',art:ART.electronics},
  {id:'fashion',label:'Moda',art:ART.jacket},
  {id:'travel',label:'Podróże',art:ART.travel},
  {id:'automotive',label:'Motoryzacja',art:ART.car},
  {id:'home',label:'Dom',art:ART.homeCategory},
  {id:'pets',label:'Zwierzęta',art:ART.pets},
  {id:'entertainment',label:'Rozrywka',art:ART.entertainment},
] as const;
