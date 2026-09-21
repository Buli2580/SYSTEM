export type HeroRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
export type HeroVisual = 'ZERO' | 'RUNNER' | 'TITAN' | 'ORACLE' | 'PATHFINDER' | 'VOID' | 'WRAITH' | 'KING' | 'ASCENDANT';
export type HeroAffinity = 'HOME' | 'WORLD' | 'QUEST' | 'TRAINING' | 'FOCUS' | 'BOSS' | 'AWAKENING';

export type HeroUnlockRule =
  | { type: 'FREE' }
  | { type: 'LEVEL'; value: number }
  | { type: 'STREAK'; value: number }
  | { type: 'VERIFIED_QUESTS'; value: number }
  | { type: 'SKILL_LEVEL'; skill: 'STR' | 'VIT' | 'INT' | 'WIL' | 'CHA' | 'CRE' | 'RES'; value: number }
  | { type: 'ACHIEVEMENT'; id: string }
  | { type: 'BOSS_DEFEATED' }
  | { type: 'WORLD_LINK' }
  | { type: 'ALL'; rules: HeroUnlockRule[] }
  | { type: 'ANY'; rules: HeroUnlockRule[] };

export type HeroCardDefinition = {
  id: string;
  name: string;
  codename: string;
  rarity: HeroRarity;
  visual: HeroVisual;
  affinity: HeroAffinity;
  accent: string;
  accentSoft: string;
  shadow: string;
  lore: string;
  unlockText: string;
  rule: HeroUnlockRule;
  order: number;
};

export type HeroProgressSnapshot = {
  level: number;
  streak: number;
  verifiedQuestCount: number;
  skillLevels: Record<'STR' | 'VIT' | 'INT' | 'WIL' | 'CHA' | 'CRE' | 'RES', number>;
  bossDefeated: boolean;
  worldLinkComplete: boolean;
  achievements: Record<string, 'LOCKED' | 'IN_PROGRESS' | 'UNLOCKED' | 'CLAIMED'>;
};

export const HERO_CARDS: readonly HeroCardDefinition[] = [
  {
    id: 'system_zero',
    name: 'SYSTEM ZERO',
    codename: 'ORIGIN',
    rarity: 'COMMON',
    visual: 'ZERO',
    affinity: 'HOME',
    accent: '#6CEEFF',
    accentSoft: 'rgba(108,238,255,0.14)',
    shadow: '#0D5D70',
    lore: 'Pierwsza forma. Bez przewagi, bez dziedzictwa. Tylko gracz i SYSTEM.',
    unlockText: 'Karta startowa.',
    rule: { type: 'FREE' },
    order: 0,
  },
  {
    id: 'night_runner',
    name: 'NIGHT RUNNER',
    codename: 'VELOCITY',
    rarity: 'RARE',
    visual: 'RUNNER',
    affinity: 'WORLD',
    accent: '#43E8FF',
    accentSoft: 'rgba(67,232,255,0.16)',
    shadow: '#075B68',
    lore: 'Nie czeka na otwarcie bramy. Znajduje drogę, zanim inni zobaczą ścieżkę.',
    unlockText: 'Ukończ bieg 5 km lub 10 zweryfikowanych questów.',
    rule: { type: 'ANY', rules: [{ type: 'ACHIEVEMENT', id: 'run_5km' }, { type: 'VERIFIED_QUESTS', value: 10 }] },
    order: 1,
  },
  {
    id: 'iron_titan',
    name: 'IRON TITAN',
    codename: 'FORGE',
    rarity: 'RARE',
    visual: 'TITAN',
    affinity: 'TRAINING',
    accent: '#F0B45A',
    accentSoft: 'rgba(240,180,90,0.16)',
    shadow: '#684416',
    lore: 'Każde powtórzenie jest uderzeniem młota. Każdy trening buduje pancerz.',
    unlockText: 'Osiągnij poziom 10 i STR 5.',
    rule: { type: 'ALL', rules: [{ type: 'LEVEL', value: 10 }, { type: 'SKILL_LEVEL', skill: 'STR', value: 5 }] },
    order: 2,
  },
  {
    id: 'oracle',
    name: 'ORACLE',
    codename: 'FORESIGHT',
    rarity: 'EPIC',
    visual: 'ORACLE',
    affinity: 'FOCUS',
    accent: '#A88CFF',
    accentSoft: 'rgba(168,140,255,0.17)',
    shadow: '#493279',
    lore: 'Zanim pojawi się quest, ORACLE widzi koszt, ryzyko i drogę do zwycięstwa.',
    unlockText: '14 dni streaka i INT 5.',
    rule: { type: 'ALL', rules: [{ type: 'STREAK', value: 14 }, { type: 'SKILL_LEVEL', skill: 'INT', value: 5 }] },
    order: 3,
  },
  {
    id: 'pathfinder',
    name: 'PATHFINDER',
    codename: 'FRONTIER',
    rarity: 'EPIC',
    visual: 'PATHFINDER',
    affinity: 'WORLD',
    accent: '#55F0B5',
    accentSoft: 'rgba(85,240,181,0.16)',
    shadow: '#176B50',
    lore: 'Mapa kończy się tam, gdzie zaczyna się jego właściwa droga.',
    unlockText: 'Połącz SYSTEM WORLD lub zdobądź osiągnięcie CARTOGRAPHER.',
    rule: { type: 'ANY', rules: [{ type: 'WORLD_LINK' }, { type: 'ACHIEVEMENT', id: 'explorer_10' }] },
    order: 4,
  },
  {
    id: 'void_walker',
    name: 'VOID WALKER',
    codename: 'ABYSS',
    rarity: 'LEGENDARY',
    visual: 'VOID',
    affinity: 'BOSS',
    accent: '#7F8CFF',
    accentSoft: 'rgba(127,140,255,0.18)',
    shadow: '#2F347B',
    lore: 'Przeszedł przez Pierwszy Mur i wrócił z miejsca, w którym światło przestaje działać.',
    unlockText: 'Pokonaj pierwszego bossa i osiągnij poziom 10.',
    rule: { type: 'ALL', rules: [{ type: 'BOSS_DEFEATED' }, { type: 'LEVEL', value: 10 }] },
    order: 5,
  },
  {
    id: 'wraith',
    name: 'WRAITH',
    codename: 'NO RETURN',
    rarity: 'LEGENDARY',
    visual: 'WRAITH',
    affinity: 'QUEST',
    accent: '#D5E7FF',
    accentSoft: 'rgba(213,231,255,0.12)',
    shadow: '#4E6075',
    lore: 'Porażka zostawiła ślad. Powrót uczynił z niego coś trudniejszego do złamania.',
    unlockText: 'Odblokuj ukryte osiągnięcie NO TURNING BACK i ukończ 25 zweryfikowanych questów.',
    rule: { type: 'ALL', rules: [{ type: 'ACHIEVEMENT', id: 'no_turning_back' }, { type: 'VERIFIED_QUESTS', value: 25 }] },
    order: 6,
  },
  {
    id: 'ash_king',
    name: 'ASH KING',
    codename: 'CROWN OF EMBERS',
    rarity: 'LEGENDARY',
    visual: 'KING',
    affinity: 'BOSS',
    accent: '#FF684A',
    accentSoft: 'rgba(255,104,74,0.18)',
    shadow: '#7A2517',
    lore: 'Nie zdobył korony. Została po wszystkim, co spłonęło po drodze.',
    unlockText: '30 dni streaka i pokonany boss.',
    rule: { type: 'ALL', rules: [{ type: 'STREAK', value: 30 }, { type: 'BOSS_DEFEATED' }] },
    order: 7,
  },
  {
    id: 'system_ascendant',
    name: 'SYSTEM ASCENDANT',
    codename: 'BEYOND RANK',
    rarity: 'MYTHIC',
    visual: 'ASCENDANT',
    affinity: 'AWAKENING',
    accent: '#FFD86C',
    accentSoft: 'rgba(255,216,108,0.20)',
    shadow: '#7D6320',
    lore: 'Forma, której SYSTEM nie przewidywał w początkowym modelu gracza.',
    unlockText: 'Poziom 50, streak 60 i 50 zweryfikowanych questów.',
    rule: { type: 'ALL', rules: [{ type: 'LEVEL', value: 50 }, { type: 'STREAK', value: 60 }, { type: 'VERIFIED_QUESTS', value: 50 }] },
    order: 8,
  },
];

export const DEFAULT_HERO_ID = 'system_zero';

export function getHeroCard(id: string | null | undefined): HeroCardDefinition {
  return HERO_CARDS.find(card => card.id === id) ?? HERO_CARDS[0];
}

export function isHeroUnlocked(card: HeroCardDefinition, progress: HeroProgressSnapshot): boolean {
  return evaluateRule(card.rule, progress);
}

export function getUnlockedHeroIds(progress: HeroProgressSnapshot): string[] {
  return HERO_CARDS.filter(card => isHeroUnlocked(card, progress)).map(card => card.id);
}

function evaluateRule(rule: HeroUnlockRule, progress: HeroProgressSnapshot): boolean {
  switch (rule.type) {
    case 'FREE': return true;
    case 'LEVEL': return progress.level >= rule.value;
    case 'STREAK': return progress.streak >= rule.value;
    case 'VERIFIED_QUESTS': return progress.verifiedQuestCount >= rule.value;
    case 'SKILL_LEVEL': return progress.skillLevels[rule.skill] >= rule.value;
    case 'ACHIEVEMENT': {
      const state = progress.achievements[rule.id];
      return state === 'UNLOCKED' || state === 'CLAIMED';
    }
    case 'BOSS_DEFEATED': return progress.bossDefeated;
    case 'WORLD_LINK': return progress.worldLinkComplete;
    case 'ALL': return rule.rules.every(item => evaluateRule(item, progress));
    case 'ANY': return rule.rules.some(item => evaluateRule(item, progress));
  }
}
