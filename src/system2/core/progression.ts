import {
    PlayerProfile,
    PlayerStats,
    Rank,
    SkillKey,
    SkillProgress,
} from './types';

export const SKILL_KEYS: SkillKey[] = [
  'STR',
  'VIT',
  'INT',
  'WIL',
  'CHA',
  'CRE',
  'RES',
];

export const SKILL_META: Record<
  SkillKey,
  {
    name: string;
    shortName: string;
    description: string;
  }
> = {
  STR: {
    name: 'SIŁA',
    shortName: 'STR',
    description: 'Siła fizyczna, trening oporowy i sprawność.',
  },

  VIT: {
    name: 'WITALNOŚĆ',
    shortName: 'VIT',
    description: 'Kondycja, ruch, regeneracja i wytrzymałość.',
  },

  INT: {
    name: 'INTELIGENCJA',
    shortName: 'INT',
    description: 'Nauka, wiedza, języki i rozwój umiejętności.',
  },

  WIL: {
    name: 'DYSCYPLINA',
    shortName: 'WIL',
    description: 'Regularność, konsekwencja i kontrola nad sobą.',
  },

  CHA: {
    name: 'RELACJE',
    shortName: 'CHA',
    description: 'Komunikacja, relacje i funkcjonowanie społeczne.',
  },

  CRE: {
    name: 'KREATYWNOŚĆ',
    shortName: 'CRE',
    description: 'Tworzenie, sztuka, pomysły i projekty.',
  },

  RES: {
    name: 'ZARADNOŚĆ',
    shortName: 'RES',
    description: 'Organizacja, praktyczne umiejętności i rozwiązywanie problemów.',
  },
};

// Początek ma być szybki.
// Później wymagania rosną coraz mocniej.
export function xpNeededForRealLevel(level: number): number {
  const safeLevel = Math.max(1, level);

  return Math.round(
    100 +
      safeLevel * 35 +
      Math.pow(safeLevel, 1.65) * 12
  );
}

export function xpNeededForSkillLevel(level: number): number {
  const safeLevel = Math.max(1, level);

  return Math.round(
    80 +
      safeLevel * 28 +
      Math.pow(safeLevel, 1.6) * 9
  );
}

export function rankForLevel(level: number): Rank {
  if (level >= 300) return 'ASCENDED';
  if (level >= 200) return 'SSS';
  if (level >= 150) return 'SS';
  if (level >= 100) return 'S';
  if (level >= 70) return 'A';
  if (level >= 45) return 'B';
  if (level >= 25) return 'C';
  if (level >= 10) return 'D';

  return 'E';
}

function createSkill(key: SkillKey): SkillProgress {
  return {
    key,
    level: 1,
    xp: 0,
    xpToNextLevel: xpNeededForSkillLevel(1),
    totalXp: 0,
  };
}

export function createInitialStats(): PlayerStats {
  return {
    STR: createSkill('STR'),
    VIT: createSkill('VIT'),
    INT: createSkill('INT'),
    WIL: createSkill('WIL'),
    CHA: createSkill('CHA'),
    CRE: createSkill('CRE'),
    RES: createSkill('RES'),
  };
}

export function createNewPlayer(
  displayName = 'GRACZ'
): PlayerProfile {
  const now = new Date().toISOString();

  return {
    id: `player_${Date.now()}`,

    displayName,

    // EQUAL ORIGIN
    // Nie istnieje wcześniejszy boost.
    realLevel: 1,
    realXp: 0,
    realXpToNextLevel: xpNeededForRealLevel(1),
    totalRealXp: 0,

    rank: 'E',

    stats: createInitialStats(),

    streak: 0,
    verifiedQuestCount: 0,

    createdAt: now,
    updatedAt: now,

    mode: 'STANDARD',

    avatarEvolution: 0,
    currentTitle: 'UNAWAKENED',

    discoveredSectors: 0,
    totalDistanceMeters: 0,

    gameEnergy: 0,
  };
}

export function addRealXp(
  player: PlayerProfile,
  amount: number
): PlayerProfile {
  if (amount <= 0) {
    return player;
  }

  let level = player.realLevel;
  let currentXp = player.realXp + amount;
  let totalXp = player.totalRealXp + amount;

  let required = xpNeededForRealLevel(level);

  while (currentXp >= required) {
    currentXp -= required;
    level += 1;
    required = xpNeededForRealLevel(level);
  }

  return {
    ...player,

    realLevel: level,
    realXp: currentXp,
    realXpToNextLevel: required,
    totalRealXp: totalXp,

    rank: rankForLevel(level),
    avatarEvolution: evolutionForLevel(level),

    updatedAt: new Date().toISOString(),
  };
}

export function addSkillXp(
  player: PlayerProfile,
  skillKey: SkillKey,
  amount: number
): PlayerProfile {
  if (amount <= 0) {
    return player;
  }

  const currentSkill = player.stats[skillKey];

  let level = currentSkill.level;
  let currentXp = currentSkill.xp + amount;
  let totalXp = currentSkill.totalXp + amount;

  let required = xpNeededForSkillLevel(level);

  while (currentXp >= required) {
    currentXp -= required;
    level += 1;
    required = xpNeededForSkillLevel(level);
  }

  return {
    ...player,

    stats: {
      ...player.stats,

      [skillKey]: {
        ...currentSkill,

        level,
        xp: currentXp,
        xpToNextLevel: required,
        totalXp,
      },
    },

    updatedAt: new Date().toISOString(),
  };
}

export function getPlayerProgressPercent(
  player: PlayerProfile
): number {
  if (player.realXpToNextLevel <= 0) return 0;

  return Math.min(
    1,
    Math.max(
      0,
      player.realXp / player.realXpToNextLevel
    )
  );
}

export function getSkillProgressPercent(
  skill: SkillProgress
): number {
  if (skill.xpToNextLevel <= 0) return 0;

  return Math.min(
    1,
    Math.max(
      0,
      skill.xp / skill.xpToNextLevel
    )
  );
}

export function evolutionForLevel(level: number): 0 | 1 | 2 {
  return level >= 25 ? 2 : level >= 10 ? 1 : 0;
}

// XP totals are canonical. Derived level/rank/bars can be rebuilt without
// inventing XP or resetting a corrupt save. Existing reward curves are unchanged.
function progressFromTotal(total: number, needed: (level: number) => number) {
  if (!Number.isSafeInteger(total) || total < 0) throw new Error('Nieprawidłowy zapis sumy XP.');
  let level = 1, xp = total, required = needed(level);
  while (xp >= required) {
    xp -= required; required = needed(++level);
    if (level > 100000) throw new Error('Suma XP wymaga kontroli zapisu. Dane nie zostały zmienione.');
  }
  return { level, xp, required };
}
export function normalizePlayer(player: PlayerProfile): PlayerProfile {
  if (!player || typeof player.id !== 'string' || typeof player.displayName !== 'string' || !player.stats ||
      !Number.isFinite(Date.parse(player.createdAt)) ||
      ![player.gameEnergy, player.verifiedQuestCount, player.totalDistanceMeters, player.streak].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0) ||
      !SKILL_KEYS.every(key => player.stats[key])) throw new Error('Zapis profilu jest uszkodzony. Dane nie zostały zresetowane.');
  const real = progressFromTotal(player.totalRealXp, xpNeededForRealLevel);
  const stats = { ...player.stats };
  for (const key of SKILL_KEYS) {
    const skill = progressFromTotal(stats[key].totalXp, xpNeededForSkillLevel);
    stats[key] = { ...stats[key], key, level: skill.level, xp: skill.xp, xpToNextLevel: skill.required };
  }
  return { ...player, stats, realLevel: real.level, realXp: real.xp, realXpToNextLevel: real.required,
    rank: rankForLevel(real.level), avatarEvolution: evolutionForLevel(real.level) };
}
