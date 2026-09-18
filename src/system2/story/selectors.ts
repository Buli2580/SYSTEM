import { CHAPTERS, STORY_REWARDS } from './catalog';
import type { StoryState } from './types';
export function mainStoryObjective(story: StoryState | null | undefined, awakening: boolean) {
 if(!awakening) return {title:'PIERWSZE PRZEBUDZENIE',subtitle:'Potwierdź pierwsze połączenie z SYSTEMEM.',completed:story?.chapters[0]?.completed??0,total:3,reward:CHAPTERS[0].reward.realXp};
 if(!story?.worldLinkComplete) return {title:'WORLD LINK',subtitle:'Odkryj 3 sektory, odnajdź Signal i wykonaj Daily Clear.',completed:story?.chapters[1]?.completed??0,total:3,reward:STORY_REWARDS.worldLink.realXp};
 if(!story.bossComplete) return {title:'THE FIRST WALL',subtitle:'BOSS PROTOCOL // FOCUS · MOVE · DISCIPLINE',completed:[story.boss?.focus_at,story.boss?.move_at,story.boss?.discipline_at].filter(Boolean).length,total:3,reward:STORY_REWARDS.boss.realXp};
 return {title:'STORY SIGNAL LOST',subtitle:'NEXT CHAPTER // UNKNOWN. Daily i Weekly pozostają aktywne.',completed:0,total:0,reward:0};
}
