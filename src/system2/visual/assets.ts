// Local Metro asset IDs register metadata; images decode only when mounted.
export const ART = {
  intro: require('../../../assets/visual/intro.webp') as number,
  home: require('../../../assets/visual/home.webp') as number,
  boss: require('../../../assets/visual/boss.webp') as number,
  run: require('../../../assets/visual/run.webp') as number,
  strength: require('../../../assets/visual/strength.webp') as number,
  study: require('../../../assets/visual/study.webp') as number,
  social: require('../../../assets/visual/social.webp') as number,
  walk: require('../../../assets/visual/walk.webp') as number,
  cycle: require('../../../assets/visual/cycle.webp') as number,
  food: require('../../../assets/visual/food.webp') as number,
  creative: require('../../../assets/visual/creative.webp') as number,
  pets: require('../../../assets/visual/pets.webp') as number,
  car: require('../../../assets/visual/car.webp') as number,
  travel: require('../../../assets/visual/travel.webp') as number,
  focus: require('../../../assets/visual/focus.webp') as number,
  homeCategory: require('../../../assets/visual/homeCategory.webp') as number,
  entertainment: require('../../../assets/visual/entertainment.webp') as number,
  jacket: require('../../../assets/visual/jacket.webp') as number,
  ring: require('../../../assets/visual/ring.webp') as number,
  pendant: require('../../../assets/visual/pendant.webp') as number,
  tool: require('../../../assets/visual/tool.webp') as number,
  electronics: require('../../../assets/visual/electronics.webp') as number,
  badgeQuest: require('../../../assets/visual/badgeQuest.webp') as number,
  badgeStreak: require('../../../assets/visual/badgeStreak.webp') as number,
  badgeBoss: require('../../../assets/visual/badgeBoss.webp') as number,
  badgeWorld: require('../../../assets/visual/badgeWorld.webp') as number,
  badgeProgress: require('../../../assets/visual/badgeProgress.webp') as number,
  badgeSpecial: require('../../../assets/visual/badgeSpecial.webp') as number,
  mapSignal: require('../../../assets/visual/mapSignal.webp') as number,
  xp: require('../../../assets/visual/xp.webp') as number,
  levelUp: require('../../../assets/visual/levelUp.webp') as number,
  aura: require('../../../assets/visual/aura.webp') as number,
  core: require('../../../assets/visual/core.webp') as number,
  character01: require('../../../assets/visual/character01.webp') as number,
  character02: require('../../../assets/visual/character02.webp') as number,
  character03: require('../../../assets/visual/character03.webp') as number,
  character04: require('../../../assets/visual/character04.webp') as number,
  character05: require('../../../assets/visual/character05.webp') as number,
  character06: require('../../../assets/visual/character06.webp') as number,
  character07: require('../../../assets/visual/character07.webp') as number,
  character08: require('../../../assets/visual/character08.webp') as number,
  character09: require('../../../assets/visual/character09.webp') as number,
  character10: require('../../../assets/visual/character10.webp') as number,
  character11: require('../../../assets/visual/character11.webp') as number,
  character12: require('../../../assets/visual/character12.webp') as number,
  character13: require('../../../assets/visual/character13.webp') as number,
  character14: require('../../../assets/visual/character14.webp') as number,
  character15: require('../../../assets/visual/character15.webp') as number,
} as const;

// Selection uses existing semantic data, never quest IDs, reward calculation or random state.
export function questArt(q: {category: string; primarySkill: string; activityType?: string}) {
  if (q.category === 'BOSS') return ART.boss;
  if (q.activityType === 'RUN') return ART.run;
  if (q.activityType === 'BIKE') return ART.cycle;
  if (q.activityType === 'WALK') return ART.walk;
  const skills: Record<string, number> = {STR:ART.strength,VIT:ART.walk,INT:ART.study,WIL:ART.focus,CHA:ART.social,CRE:ART.creative,RES:ART.focus};
  return skills[q.primarySkill] ?? ART.focus;
}
const CHARACTERS: Record<string, readonly number[]> = {
  CYBER:[ART.character01,ART.character03,ART.character08,ART.character11,ART.character14],
  DARK:[ART.character02,ART.character05,ART.character07,ART.character09,ART.character12],
  WARLORD:[ART.character06,ART.character10,ART.character04,ART.character13,ART.character15],
};
export function characterArt(style: string, stage: number) {
  return (CHARACTERS[style] ?? CHARACTERS.CYBER)[Number.isFinite(stage)?Math.max(0,Math.min(4,Math.floor(stage))):0];
}
const ITEM_ART: Record<string, number> = {
  'relic-origin-shard':ART.badgeProgress,'badge-first-wall':ART.badgeBoss,
  'frame-night-runner':ART.badgeQuest,'aura-iron-titan':ART.aura,
  'cosmetic-oracle-glyph':ART.badgeSpecial,'relic-ascendant-core':ART.core,
  WEAPON:ART.tool,ARMOR:ART.jacket,RING:ART.ring,RELIC:ART.pendant,
};
export function itemArt(item: {id?: string; slot?: string}) {return ITEM_ART[item.id ?? ''] ?? ITEM_ART[item.slot ?? ''];}
export function achievementArt(category: string) {
  const categories: Record<string, number> = {QUESTS:ART.badgeQuest,EXPLORATION:ART.badgeWorld,CONSISTENCY:ART.badgeStreak,PROGRESSION:ART.badgeProgress,BOSSES:ART.badgeBoss,FIELD_ACTIVITY:ART.badgeWorld,SPECIAL:ART.badgeSpecial};
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
