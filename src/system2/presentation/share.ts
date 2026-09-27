import type {ShareCard} from '../social/shareCard';
export function shareText(card:ShareCard){const stats=[card.publicStats.level&&`LV ${card.publicStats.level}`,card.publicStats.rank&&`RANK ${card.publicStats.rank}`,card.publicStats.streak&&`${card.publicStats.streak} DAY STREAK`].filter(Boolean).join(' · ');return [card.headline,card.subline,stats,'SYSTEM'].filter(Boolean).join('\n');}
