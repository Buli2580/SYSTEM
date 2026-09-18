import type { Arc, Chapter, StoryQuestDefinition } from './types';
import type { RunnableQuest } from '../quests/types';
export const WORLD_LINK_ID = 'world_link_chapter_2', BOSS_ID = 'the_first_wall_v1';
export const STORY_REWARDS = {
 worldLink: { realXp: 400, skillXp: { RES: 100 }, gameEnergy: 25 },
 extraMile: { realXp: 50, skillXp: { WIL: 40 } },
 hidden: { realXp: 60, skillXp: { WIL: 50 } },
 rematch: { realXp: 0, skillXp: { WIL: 15 } },
 boss: { realXp: 500, skillXp: { WIL: 120, VIT: 80 }, gameEnergy: 30 },
};
export const ARC: Arc = { id: 'arc_01', title: 'AWAKENING', chapterIds: ['awakening_chapter_1', WORLD_LINK_ID] };
export const CHAPTERS: Chapter[] = [
 { id: 'awakening_chapter_1', arcId: ARC.id, number: 1, title: 'FIRST AWAKENING', description: 'Potwierdź pierwsze połączenie z SYSTEMEM.',
 requirements: ['first_movement_v1','focus_protocol_v1','final_trial_v1'], questIds: ['first_movement_v1','focus_protocol_v1','final_trial_v1'], reward: {realXp:300}, unlockCondition: null },
 { id: WORLD_LINK_ID, arcId: ARC.id, number: 2, title: 'WORLD LINK', description: 'Twoje działania pozostawiają ślad w warstwie świata.',
 requirements: ['world_sectors_3','first_signal','daily_clear'], questIds: ['world_sectors_3','first_signal','daily_clear'], reward: STORY_REWARDS.worldLink, unlockCondition: 'awakening_chapter_1' },
];
export const BOSS_FOCUS = 'wall_focus_v1', BOSS_WALK = 'wall_walk_v1', BOSS_RUN = 'wall_run_v1';
function stage(id: string, order: number, activity?: 'WALK'|'RUN'): RunnableQuest {
 return {id,order,title: order===1 ? 'THE FIRST WALL // FOCUS' : `THE FIRST WALL // ${activity}`, description: order===1 ? '15 minut nieprzerwanej aktywnej sesji.' : 'Potwierdź 2 km ruchu. Stage pozostaje ukończony po restarcie.',
 category:'BOSS',difficulty:'NORMAL',primarySkill:order===1?'WIL':'VIT',secondarySkills:[],arc:'FIRST_WALL',
 verification: activity ? {type:'GPS_DISTANCE',minimumDistanceMeters:2000,verificationScoreRequired:70} : {type:'TIMER',minimumDurationSeconds:900,verificationScoreRequired:100},
 activityType:activity,verificationStrength:'STANDARD',rewards:{realXp:0},progress:0,progressTarget:activity?2000:900,createdAt:'2026-09-18T00:00:00.000Z'};
}
export const BOSS_QUESTS = [stage(BOSS_FOCUS,1),stage(BOSS_WALK,2,'WALK'),stage(BOSS_RUN,2,'RUN')];
export function qualifiesExtraMile(target: number, distance: number) { return Number.isFinite(distance) && target > 0 && distance >= target * 1.25; }
export function attemptKind(q: RunnableQuest) { return q.activityType ?? q.verification.type; }

export const EXTRA_MILE: StoryQuestDefinition = { id:'extra_mile_v1',kind:'SIDE',title:'EXTRA MILE',reward:STORY_REWARDS.extraMile,hidden:false };
export const NO_TURNING_BACK: StoryQuestDefinition = { id:'no_turning_back_v1',kind:'HIDDEN',title:'NO TURNING BACK',reward:STORY_REWARDS.hidden,hidden:true };
