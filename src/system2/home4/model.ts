export type WorldEvent = import('../gameMaster/types').WorldReaction | 'HOME' | 'QUEST';
export type MissionAction = { label: string; onPress: () => void; disabled?: boolean };
// Presentation seam: future orchestration supplies an action, never rewards or transitions here.
export function missionAction(label: string, onPress: () => void): MissionAction { return { label, onPress }; }
