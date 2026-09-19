export type SkillKey =
  | 'STR'
  | 'VIT'
  | 'INT'
  | 'WIL'
  | 'CHA'
  | 'CRE'
  | 'RES';

export type SkillDefinition = {
  key: SkillKey;
  name: string;
  description: string;
  glyph: string;
};

export type SkillState = {
  level: number;
  xp: number;
  nextLevelXp: number;
};

export type PlayerState = {
  realLevel: number;
  rank: string;
  xp: number;
  nextLevelXp: number;
  streak: number;
  verifiedQuests: number;

  skills: Record<SkillKey, SkillState>;
};

export const SKILLS: SkillDefinition[] = [
  {
    key: 'STR',
    name: 'SIŁA',
    description: 'Siła fizyczna i rozwój ciała',
    glyph: '◆',
  },
  {
    key: 'VIT',
    name: 'WITALNOŚĆ',
    description: 'Kondycja, ruch i wytrzymałość',
    glyph: '▲',
  },
  {
    key: 'INT',
    name: 'INTELIGENCJA',
    description: 'Wiedza, nauka i rozwój umysłu',
    glyph: '✦',
  },
  {
    key: 'WIL',
    name: 'DYSCYPLINA',
    description: 'Regularność i siła woli',
    glyph: '⬟',
  },
  {
    key: 'CHA',
    name: 'RELACJE',
    description: 'Komunikacja i ludzie',
    glyph: '◇',
  },
  {
    key: 'CRE',
    name: 'KREATYWNOŚĆ',
    description: 'Tworzenie i pomysłowość',
    glyph: '✧',
  },
  {
    key: 'RES',
    name: 'ZARADNOŚĆ',
    description: 'Organizacja i rozwiązywanie problemów',
    glyph: '⬢',
  },
];

const INITIAL_SKILL: SkillState = {
  level: 1,
  xp: 0,
  nextLevelXp: 100,
};

export const INITIAL_PLAYER: PlayerState = {
  realLevel: 1,
  rank: 'E',
  xp: 0,
  nextLevelXp: 100,

  streak: 0,
  verifiedQuests: 0,

  skills: {
    STR: { ...INITIAL_SKILL },
    VIT: { ...INITIAL_SKILL },
    INT: { ...INITIAL_SKILL },
    WIL: { ...INITIAL_SKILL },
    CHA: { ...INITIAL_SKILL },
    CRE: { ...INITIAL_SKILL },
    RES: { ...INITIAL_SKILL },
  },
};