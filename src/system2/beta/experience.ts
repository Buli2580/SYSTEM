export type BetaExperienceStage='AWAKENING'|'IDENTITY'|'GOAL'|'FIRST_QUEST'|'DAILY_LOOP'|'WORLD'|'SOCIAL';
export type BetaExperienceState={awakened:boolean;identityReady:boolean;goalReady:boolean;hasQuest:boolean;worldUnlocked:boolean;socialReady:boolean};
export function nextBetaStage(s:BetaExperienceState):BetaExperienceStage{if(!s.awakened)return 'AWAKENING';if(!s.identityReady)return 'IDENTITY';if(!s.goalReady)return 'GOAL';if(!s.hasQuest)return 'FIRST_QUEST';if(!s.worldUnlocked)return 'DAILY_LOOP';if(!s.socialReady)return 'WORLD';return 'SOCIAL';}
export const BETA_EXPERIENCE_FLOW:BetaExperienceStage[]=['AWAKENING','IDENTITY','GOAL','FIRST_QUEST','DAILY_LOOP','WORLD','SOCIAL'];
