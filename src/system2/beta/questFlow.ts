export type QuestExperiencePhase='READY'|'ACTIVE'|'VERIFYING'|'COMPLETE'|'NEXT';
export function questExperiencePhase(i:{active:boolean;verifying:boolean;completed:boolean}):QuestExperiencePhase{if(i.verifying)return 'VERIFYING';if(i.completed)return 'COMPLETE';if(i.active)return 'ACTIVE';return 'READY';}
export function nextQuestCta(p:QuestExperiencePhase){return ({READY:'START QUEST',ACTIVE:'VERIFY PROGRESS',VERIFYING:'VERIFYING…',COMPLETE:'NEXT QUEST',NEXT:'NEXT QUEST'} as const)[p];}
