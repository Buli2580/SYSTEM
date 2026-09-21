export type QuestExperiencePhase =
  | 'CHECKING'
  | 'READY'
  | 'STARTING'
  | 'ACTIVE'
  | 'VERIFYING'
  | 'COMPLETE'
  | 'RECOVERY'
  | 'LOCKED'
  | 'NEXT';

export const QUEST_FLOW_STEPS = ['BRIEFING','START','ACTIVE','VERIFY','REWARD','NEXT'] as const;
export type QuestFlowStep = typeof QUEST_FLOW_STEPS[number];

export function questExperiencePhase(i:{active:boolean;verifying:boolean;completed:boolean}):QuestExperiencePhase{
  if(i.verifying)return 'VERIFYING';
  if(i.completed)return 'COMPLETE';
  if(i.active)return 'ACTIVE';
  return 'READY';
}

export function questExperiencePhaseFromRun(status:string):QuestExperiencePhase{
  if(status==='CHECKING')return 'CHECKING';
  if(status==='READY')return 'READY';
  if(status==='STARTING')return 'STARTING';
  if(status==='TRACKING')return 'ACTIVE';
  if(status==='COMPLETING')return 'VERIFYING';
  if(status==='COMPLETED')return 'COMPLETE';
  if(status==='ERROR'||status==='DENIED')return 'RECOVERY';
  if(status==='LOCKED')return 'LOCKED';
  return 'CHECKING';
}

export function activeQuestFlowStep(phase:QuestExperiencePhase):QuestFlowStep{
  if(phase==='CHECKING'||phase==='READY'||phase==='LOCKED'||phase==='RECOVERY')return 'BRIEFING';
  if(phase==='STARTING')return 'START';
  if(phase==='ACTIVE')return 'ACTIVE';
  if(phase==='VERIFYING')return 'VERIFY';
  if(phase==='COMPLETE')return 'REWARD';
  return 'NEXT';
}

export function questExperienceMessage(phase:QuestExperiencePhase){
  return ({
    CHECKING:'SYSTEM sprawdza zapis i dostęp do misji.',
    READY:'Briefing gotowy. Rozpocznij misję, gdy możesz ją wykonać naprawdę.',
    STARTING:'Uruchamianie weryfikacji i przygotowanie czujników.',
    ACTIVE:'Misja trwa. SYSTEM zapisuje zweryfikowany postęp.',
    VERIFYING:'Cel osiągnięty. SYSTEM potwierdza dowód i zapis nagrody.',
    COMPLETE:'Nagroda została zapisana. Wybierz następną akcję.',
    RECOVERY:'Próba została zatrzymana. Postęp i nagrody nie są fałszowane — możesz bezpiecznie spróbować ponownie.',
    LOCKED:'Ta misja nie jest jeszcze dostępna. SYSTEM pokaże właściwy następny krok.',
    NEXT:'Przejdź do kolejnej misji.',
  } as const)[phase];
}

export function nextQuestCta(p:QuestExperiencePhase){
  return ({
    CHECKING:'CHECKING…',
    READY:'START QUEST',
    STARTING:'STARTING…',
    ACTIVE:'MISSION ACTIVE',
    VERIFYING:'VERIFYING…',
    COMPLETE:'NEXT ACTION',
    RECOVERY:'RECOVER / RETRY',
    LOCKED:'VIEW QUEST HUB',
    NEXT:'NEXT QUEST',
  } as const)[p];
}
