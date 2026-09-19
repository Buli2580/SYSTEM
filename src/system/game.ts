export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export type PlayerClass =
  | 'HUNTER'
  | 'TITAN'
  | 'SCHOLAR'
  | 'ARCHITECT'
  | 'SHADOW';

export type StatKey =
  | 'strength'
  | 'discipline'
  | 'intelligence'
  | 'health'
  | 'wealth';

export type PlayerStats = Record<StatKey, number>;

export type Quest = {
  id: number;
  title: string;
  xp: number;
  coins: number;
  done: boolean;
  stat: StatKey;
  statGain: number;
};

export type BossQuest = Quest & {
  boss: true;
};

export const EMPTY_STATS: PlayerStats = {
  strength: 1,
  discipline: 1,
  intelligence: 1,
  health: 1,
  wealth: 1,
};

export const CLASS_META: Record<
  PlayerClass,
  {
    title: string;
    subtitle: string;
    glyph: string;
    description: string;
  }
> = {
  HUNTER: {
    title: 'ŁOWCA',
    subtitle: 'WSZECHSTRONNY WOJOWNIK',
    glyph: '⚔',
    description:
      'Uniwersalna klasa dla gracza rozwijającego kilka obszarów życia.',
  },

  TITAN: {
    title: 'TYTAN',
    subtitle: 'SIŁA FIZYCZNA',
    glyph: '◆',
    description:
      'Siła, sylwetka, kondycja, zdrowie i wytrzymałość.',
  },

  SCHOLAR: {
    title: 'UCZONY',
    subtitle: 'POSZUKIWACZ WIEDZY',
    glyph: '✦',
    description:
      'Nauka, języki, wiedza oraz rozwój nowych umiejętności.',
  },

  ARCHITECT: {
    title: 'ARCHITEKT',
    subtitle: 'TWÓRCA SYSTEMU',
    glyph: '⌬',
    description:
      'Biznes, pieniądze, strategia i budowanie własnych projektów.',
  },

  SHADOW: {
    title: 'CIEŃ',
    subtitle: 'MISTRZ DYSCYPLINY',
    glyph: '◒',
    description:
      'Koncentracja, dyscyplina, regularność i wykonywanie trudnych zadań.',
  },
};

const XP_TO_NEXT = [
  100, 150, 210, 280, 360, 450, 550, 660, 780, 920,
  1080, 1260, 1460, 1680, 1920, 2180, 2460, 2760,
  3080, 3420, 3780, 4160, 4560, 4980, 5440, 5920,
  6420, 6940, 7480,
];

export function xpNeededForLevel(level: number) {
  if (level <= XP_TO_NEXT.length) {
    return XP_TO_NEXT[level - 1];
  }

  const extra = level - XP_TO_NEXT.length;
  const base = XP_TO_NEXT[XP_TO_NEXT.length - 1];

  return Math.round(
    (base * Math.pow(1.12, extra)) / 10
  ) * 10;
}

export function calculateLevel(totalXp: number) {
  let level = 1;
  let remaining = Math.max(0, totalXp);

  while (level < 500) {
    const needed = xpNeededForLevel(level);

    if (remaining < needed) {
      return {
        level,
        currentXp: remaining,
        neededXp: needed,
      };
    }

    remaining -= needed;
    level++;
  }

  return {
    level,
    currentXp: remaining,
    neededXp: xpNeededForLevel(level),
  };
}

export function rankForLevel(level: number) {
  if (level >= 50) return 'MONARCH';
  if (level >= 40) return 'MASTER';
  if (level >= 30) return 'S';
  if (level >= 20) return 'A';
  if (level >= 15) return 'B';
  if (level >= 10) return 'C';
  if (level >= 5) return 'D';

  return 'E';
}

export function evolutionForLevel(level: number) {
  if (level >= 50) {
    return {
      tier: 7,
      title: 'FORMA MONARCHY',
      aura: 'AURA WŁADCY',
    };
  }

  if (level >= 40) {
    return {
      tier: 6,
      title: 'FORMA MISTRZA',
      aura: 'AURA MISTRZA',
    };
  }

  if (level >= 30) {
    return {
      tier: 5,
      title: 'FORMA ELITARNA',
      aura: 'AURA ELITY',
    };
  }

  if (level >= 20) {
    return {
      tier: 4,
      title: 'WYNIESIONY',
      aura: 'AURA WYNIESIENIA',
    };
  }

  if (level >= 10) {
    return {
      tier: 3,
      title: 'AWANGARDA',
      aura: 'AURA MOCY',
    };
  }

  if (level >= 5) {
    return {
      tier: 2,
      title: 'PRZEBUDZONY',
      aura: 'AURA PRZEBUDZENIA',
    };
  }

  return {
    tier: 1,
    title: 'POCZĄTKUJĄCY',
    aura: 'UŚPIONA AURA',
  };
}

export function startingStats(
  playerClass: PlayerClass
): PlayerStats {
  const stats = {
    ...EMPTY_STATS,
  };

  if (playerClass === 'HUNTER') {
    stats.discipline++;
    stats.health++;
  }

  if (playerClass === 'TITAN') {
    stats.strength += 2;
  }

  if (playerClass === 'SCHOLAR') {
    stats.intelligence += 2;
  }

  if (playerClass === 'ARCHITECT') {
    stats.wealth += 2;
  }

  if (playerClass === 'SHADOW') {
    stats.discipline += 2;
  }

  return stats;
}

export function categoryFor(goal: string) {
  const value = goal.toLowerCase();

  if (
    /(business|biznes|firma|money|pienią|milion|startup|sprzeda|zarob|klient)/.test(
      value
    )
  ) {
    return 'business';
  }

  if (
    /(fitness|gym|sił|schud|waga|weight|zdrow|muscle|trening)/.test(
      value
    )
  ) {
    return 'fitness';
  }

  if (
    /(english|angiel|język|language|nauk|uczyć|wiedza)/.test(
      value
    )
  ) {
    return 'learning';
  }

  return 'general';
}

export function offlineQuests(
  goal: string,
  seed: number
): Quest[] {
  const category = categoryFor(goal);

  const pools: Record<string, string[]> = {
    business: [
      'Skontaktuj się z jednym potencjalnym klientem',
      'Poświęć 30 minut na analizę swojego rynku',
      'Przygotuj jedną konkretną ofertę sprzedażową',
      'Wykonaj czynność, która może wygenerować przychód',
      'Przeanalizuj jednego konkurenta',
      'Zapisz 3 problemy klientów, które możesz rozwiązać',
      'Przygotuj jeden materiał sprzedażowy',
      'Znajdź 3 nowych potencjalnych klientów',
      'Popraw jeden element swojej oferty',
    ],

    fitness: [
      'Zrób dziś co najmniej 6000 kroków',
      'Wykonaj minimum 20 minut aktywności fizycznej',
      'Przygotuj jeden zdrowy posiłek',
      'Wypij co najmniej 2 litry wody',
      'Wykonaj 30 minut treningu cardio',
      'Nie jedz dziś fast foodu',
      'Wykonaj krótki trening siłowy',
      'Zrób 15 minut dodatkowego ruchu',
      'Przygotuj jedzenie na kolejny dzień',
    ],

    learning: [
      'Naucz się dziś 10 nowych rzeczy',
      'Ucz się przez 20 minut bez rozpraszaczy',
      'Zapisz najważniejsze rzeczy, których się dziś nauczyłeś',
      'Ćwicz jedną umiejętność przez 30 minut',
      'Czytaj coś wartościowego przez 20 minut',
      'Powtórz materiał z poprzedniego dnia',
      'Zrób krótkie podsumowanie swojej nauki',
      'Rozwiąż jedno praktyczne ćwiczenie',
      'Poświęć 15 minut na powtórkę',
    ],

    general: [
      'Wykonaj jedną konkretną czynność przybliżającą Cię do Głównej Misji',
      'Pracuj nad Główną Misją przez minimum 20 minut',
      'Usuń jedną przeszkodę spowalniającą Twój rozwój',
      'Zapisz 3 kolejne kroki do wykonania',
      'Dokończ jedno zadanie, które odkładasz',
      'Zmierz i zapisz dzisiejszy postęp',
      'Zrób dziś jedną rzecz, której normalnie unikasz',
      'Poświęć 30 minut wyłącznie na swój najważniejszy cel',
      'Zaplanuj najważniejsze zadanie na jutro',
    ],
  };

  const pool = pools[category];
  const first = Math.abs(seed * 3) % pool.length;

  return [0, 1, 2].map((offset, index) => ({
    id: index + 1,
    title:
      pool[
        (first + offset) %
          pool.length
      ],

    xp: [30, 40, 50][index],
    coins: [10, 15, 20][index],
    done: false,

    stat:
      index === 0
        ? 'discipline'
        : index === 1
        ? 'intelligence'
        : category === 'fitness'
        ? 'strength'
        : category === 'business'
        ? 'wealth'
        : 'discipline',

    statGain:
      index === 2
        ? 2
        : 1,
  }));
}

export function createBoss(
  goal: string
): BossQuest {
  return {
    id: 999,
    title:
      `Wykonaj duże wyzwanie przybliżające Cię do celu: "${goal}"`,
    xp: 220,
    coins: 100,
    done: false,
    stat: 'discipline',
    statGain: 4,
    boss: true,
  };
}
export function todayKey() {
  const d = new Date();

  const year =
    d.getFullYear();

  const month =
    String(
      d.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      d.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}