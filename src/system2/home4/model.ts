export type WorldEvent = 'HOME' | 'QUEST' | 'BOSS' | 'AWAKENING' | 'VICTORY';
export type MissionAction = { label: string; onPress: () => void; disabled?: boolean };
// Presentation seam: future orchestration supplies an action, never rewards or transitions here.
export function missionAction(label: string, onPress: () => void): MissionAction { return { label, onPress }; }
export function worldPresentation(input: {hour:number; level:number; bossActive:boolean; bossComplete:boolean; reduced:boolean; lowPower:boolean}) {
 const animate = !input.reduced && !input.lowPower;
 return {
  night: input.hour < 6 || input.hour >= 19,
  tier: input.level >= 25 ? 3 : input.level >= 10 ? 2 : 1,
  boss: input.bossComplete ? 'CLEARED' : input.bossActive ? 'THREAT' : 'DORMANT',
  weather: input.bossActive ? 'ASH' : 'MIST',
  animate, particles: animate ? 6 : 0, parallax: animate ? 6 : 0,
 } as const;
}
