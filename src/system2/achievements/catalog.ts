import type { AchievementDefinition, TitleDefinition } from './types';

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id:'first_clear', name:'FIRST CLEAR', description:'Ukończ pierwszy zweryfikowany quest.', category:'QUESTS', hidden:false, target:1, progressKey:'verifiedQuestCount', reward:{realXp:0}, tier:'COMMON', order:10 },
  { id:'hunter_10', name:'HUNTER', description:'Ukończ 10 zweryfikowanych questów.', category:'QUESTS', hidden:false, target:10, progressKey:'verifiedQuestCount', reward:{realXp:0}, tier:'UNCOMMON', order:20 },
  { id:'veteran_50', name:'VETERAN', description:'Ukończ 50 zweryfikowanych questów.', category:'QUESTS', hidden:false, target:50, progressKey:'verifiedQuestCount', reward:{realXp:0}, tier:'EPIC', order:30 },
  { id:'momentum_3', name:'MOMENTUM', description:'Osiągnij streak 3 dni.', category:'CONSISTENCY', hidden:false, target:3, progressKey:'currentStreak', reward:{realXp:0}, tier:'COMMON', order:10 },
  { id:'unbroken_7', name:'UNBROKEN', description:'Osiągnij streak 7 dni.', category:'CONSISTENCY', hidden:false, target:7, progressKey:'currentStreak', reward:{realXp:0}, tier:'RARE', order:20 },
  { id:'discipline_30', name:'DISCIPLINE', description:'Osiągnij streak 30 dni.', category:'CONSISTENCY', hidden:false, target:30, progressKey:'currentStreak', reward:{realXp:0,titleId:'DISCIPLINED'}, tier:'LEGENDARY', order:30 },
  { id:'level_5', name:'RISING', description:'Osiągnij REAL LEVEL 5.', category:'PROGRESSION', hidden:false, target:5, progressKey:'realLevel', reward:{realXp:0}, tier:'COMMON', order:10 },
  { id:'level_10', name:'DOUBLE DIGITS', description:'Osiągnij REAL LEVEL 10.', category:'PROGRESSION', hidden:false, target:10, progressKey:'realLevel', reward:{realXp:0,titleId:'RISING HUNTER'}, tier:'RARE', order:20 },
  { id:'xp_10000', name:'POWER ACCUMULATOR', description:'Zdobądź 10 000 REAL XP.', category:'PROGRESSION', hidden:false, target:10000, progressKey:'totalRealXp', reward:{realXp:0}, tier:'EPIC', order:30 },
  { id:'pathfinder_5', name:'PATHFINDER II', description:'Odkryj 5 sektorów świata.', category:'EXPLORATION', hidden:false, target:5, progressKey:'sectorsDiscovered', reward:{realXp:0}, tier:'UNCOMMON', order:10 },
  { id:'explorer_25', name:'SECTOR HUNTER', description:'Odkryj 25 sektorów świata.', category:'EXPLORATION', hidden:false, target:25, progressKey:'sectorsDiscovered', reward:{realXp:0,titleId:'SECTOR HUNTER'}, tier:'EPIC', order:20 },
  { id:'distance_10k', name:'10K', description:'Zarejestruj 10 km zweryfikowanego ruchu.', category:'FIELD_ACTIVITY', hidden:false, target:10000, progressKey:'fieldQuestsDistance', reward:{realXp:0}, tier:'COMMON', order:10 },
  { id:'distance_100k', name:'CENTURY', description:'Zarejestruj 100 km zweryfikowanego ruchu.', category:'FIELD_ACTIVITY', hidden:false, target:100000, progressKey:'fieldQuestsDistance', reward:{realXp:0,titleId:'CENTURY WALKER'}, tier:'EPIC', order:20 },
];

export const ACHIEVEMENT_TITLES: readonly TitleDefinition[] = [
  { id:'DISCIPLINED', name:'DISCIPLINED', description:'30-day streak title.', unlockedByAchievement:'discipline_30', order:100 },
  { id:'RISING HUNTER', name:'RISING HUNTER', description:'REAL LEVEL 10 title.', unlockedByAchievement:'level_10', order:110 },
  { id:'SECTOR HUNTER', name:'SECTOR HUNTER', description:'World exploration title.', unlockedByAchievement:'explorer_25', order:120 },
  { id:'CENTURY WALKER', name:'CENTURY WALKER', description:'100 km verified movement title.', unlockedByAchievement:'distance_100k', order:130 },
];

export function achievementById(id:string) { return ACHIEVEMENTS.find(item => item.id === id); }
export function titleById(id:string) { return ACHIEVEMENT_TITLES.find(item => item.id === id); }
