import { readBossDifficulty } from '../adaptive/storage';
import { applyQuestRewards } from '../core/questEngine';
import type { SQLiteDatabase } from 'expo-sqlite';
import { type PlayerProfile, type QuestReward } from '../core';
import type { RunnableQuest, QuestEvidence } from '../quests/types';
import { BOSS_ID, BOSS_FOCUS, BOSS_WALK, BOSS_RUN, CHAPTERS, STORY_REWARDS, WORLD_LINK_ID, qualifiesExtraMile, EXTRA_MILE, NO_TURNING_BACK } from '../story/catalog';
import type { BossProgress, QuestAttempt, StoryEvent, StoryEventType, StoryState } from '../story/types';
import { dayKey, dayOrdinal } from '../daily/calendar';
import { dailyBossDamage, bossHealth } from '../story/damage';
const nowISO = () => new Date(Date.now()).toISOString();
export async function storyEvent(db: SQLiteDatabase, id: string, type: StoryEventType, title: string, subtitle: string | null = null) {
 await db.runAsync('INSERT INTO story_events(id,type,title,subtitle,created_at,consumed) VALUES (?,?,?,?,?,0) ON CONFLICT(id) DO NOTHING',id,type,title,subtitle,nowISO());
}
async function award(db: SQLiteDatabase, player: PlayerProfile, id: string, reward: QuestReward, type: StoryEventType, title: string) {
 const claim=await db.runAsync('INSERT INTO story_progress(id,completed_at) VALUES (?,?) ON CONFLICT(id) DO NOTHING',id,nowISO());
 if(!claim.changes) return player;
 const next=applyQuestRewards(player,reward,nowISO());
 await db.runAsync('UPDATE app_state SET value=? WHERE key=?',JSON.stringify(next),'player');
 await storyEvent(db,id,type,title,`+${reward.realXp} REAL XP · ${Object.entries(reward.skillXp??{}).map(([k,v])=>`+${v} ${k} XP`).join(' · ')} · +${reward.gameEnergy??0} ENERGII`);
 return next;
}
export async function bossAccess(db: SQLiteDatabase, questId: string) {
 const completed=await db.getFirstAsync('SELECT id FROM story_progress WHERE id=?',WORLD_LINK_ID);
 if(!completed) return false;
 const boss=await db.getFirstAsync<BossProgress>('SELECT * FROM boss_progress WHERE id=?',BOSS_ID);
 if(!boss) return false;
 return questId===BOSS_FOCUS ? !boss.focus_at : [BOSS_WALK,BOSS_RUN].includes(questId) && !!boss.focus_at && !boss.move_at;
}
export async function reconcileStory(db: SQLiteDatabase, player: PlayerProfile, completedIds: string[]): Promise<{player:PlayerProfile;story:StoryState}> {
 const chapter1=Boolean(await db.getFirstAsync('SELECT chapter_id FROM chapter_completions WHERE chapter_id=?','awakening_chapter_1'));
 const sectorCount=(await db.getFirstAsync<{n:number}>('SELECT COUNT(*) AS n FROM discovered_sectors'))?.n??0;
 const signal=Boolean(await db.getFirstAsync("SELECT id FROM world_signals WHERE id='first_world_signal_v1' AND status='LOCATED'"));
 const dailyClear=Boolean(await db.getFirstAsync("SELECT bonus_key FROM protocol_bonuses WHERE kind='daily_clear' LIMIT 1"));
 const milestones={sectors:chapter1&&sectorCount>=3,signal:chapter1&&signal,dailyClear:chapter1&&dailyClear};
 let next=player;
 if(chapter1) {
   await storyEvent(db,'chapter1_completed','CHAPTER_COMPLETED','PRZEBUDZENIE UKOŃCZONE');
   await storyEvent(db,'chapter2_unlocked','CHAPTER_UNLOCKED','POŁĄCZENIE ZE ŚWIATEM DOSTĘPNE');
 }
 if(chapter1&&signal) await storyEvent(db,'first_signal_located','FIRST_SIGNAL_LOCATED','PIERWSZY SYGNAŁ ZLOKALIZOWANY');
 const progress=Object.values(milestones).filter(Boolean).length;
 if(progress===3) {
   next=await award(db,next,WORLD_LINK_ID,STORY_REWARDS.worldLink,'CHAPTER_COMPLETED','POŁĄCZENIE ZE ŚWIATEM UKOŃCZONE');
   await db.runAsync('INSERT INTO chapter_completions(chapter_id,completed_at) VALUES (?,?) ON CONFLICT(chapter_id) DO NOTHING',WORLD_LINK_ID,nowISO());
   await storyEvent(db,'title_pathfinder','TITLE_UNLOCKED','ODKRYWCA');
 }
 const boss=await db.getFirstAsync<BossProgress>('SELECT * FROM boss_progress WHERE id=?',BOSS_ID);
 if(boss)boss.difficulty=await readBossDifficulty(db);
 const supportRow=await db.getFirstAsync<{total:number}>(
   'SELECT COALESCE(SUM(damage),0) AS total FROM boss_contributions WHERE boss_id=?',
   BOSS_ID
 );
 const bossSupportDamage=Math.min(20,Math.max(0,supportRow?.total??0));
 if(boss?.focus_at&&boss.move_at&&boss.discipline_at) {
   next=await award(db,next,BOSS_ID,STORY_REWARDS.boss,'BOSS_DEFEATED','PIERWSZY MUR // BOSS POKONANY');
   await storyEvent(db,'title_wallbreaker','TITLE_UNLOCKED','POGROMCA MURU');
 }
 const has=async(id:string)=>Boolean(await db.getFirstAsync('SELECT id FROM story_progress WHERE id=?',id));
 const worldLinkComplete=await has(WORLD_LINK_ID),bossComplete=await has(BOSS_ID);
 const rematches=await db.getAllAsync<{quest_id:string}>(`SELECT DISTINCT a.quest_id FROM quest_attempts a WHERE a.eligible=1 AND NOT EXISTS (SELECT 1 FROM quest_completions c WHERE c.quest_id=a.quest_id) ORDER BY a.started_at DESC LIMIT 50`);
 return {player:next,story:{ milestones,worldLinkComplete,bossComplete,boss,bossSupportDamage,bossHp:bossHealth(boss,bossSupportDamage),sideComplete:await has('extra_mile_v1'),hiddenComplete:await has('no_turning_back_v1'),
 rematchQuestIds:rematches.map(r=>r.quest_id),pendingEvents:await db.getAllAsync<StoryEvent>('SELECT * FROM story_events WHERE consumed=0 ORDER BY created_at,id LIMIT 20'),
 chapters:CHAPTERS.map((c,index)=>({...c,completed:index===0?c.questIds.filter(id=>completedIds.includes(id)).length:progress,total:3,
 status:index===0?(chapter1?'COMPLETED':completedIds.some(id=>c.questIds.includes(id))?'ACTIVE':'AVAILABLE'):worldLinkComplete?'COMPLETED':!chapter1?'LOCKED':progress?'ACTIVE':'AVAILABLE'}))}};
}
export async function completeStoryActivity(db:SQLiteDatabase,player:PlayerProfile,quest:RunnableQuest,evidence:QuestEvidence) {
 let next=player;
 if(quest.category==='DAILY'&&quest.verification.type==='GPS_DISTANCE'&&evidence.verificationType==='GPS_DISTANCE'&&evidence.activity?.verdict==='VERIFIED'&&qualifiesExtraMile(quest.verification.minimumDistanceMeters,evidence.distanceMeters)) {
   next=await award(db,next,EXTRA_MILE.id,EXTRA_MILE.reward,'SIDE_QUEST_COMPLETED','DODATKOWY WYSIŁEK UKOŃCZONY');
 }
 if(evidence.attemptId) {
   const attempt=await db.getFirstAsync<QuestAttempt>('SELECT * FROM quest_attempts WHERE attempt_id=?',evidence.attemptId);
   if(!attempt||attempt.quest_id!==quest.id||attempt.result!==null) throw new Error('Ta próba nie jest aktywna. Rozpocznij ponownie.');
   const prior=await db.getFirstAsync<QuestAttempt>('SELECT * FROM quest_attempts WHERE kind=? AND eligible=1 AND ended_at<? AND attempt_id<>? ORDER BY ended_at DESC LIMIT 1',attempt.kind,attempt.started_at,attempt.attempt_id);
   if(prior) next=await award(db,next,NO_TURNING_BACK.id,NO_TURNING_BACK.reward,'HIDDEN_QUEST_DISCOVERED','BEZ ODWROTU');
   const rematch=await db.getFirstAsync('SELECT attempt_id FROM quest_attempts WHERE quest_id=? AND eligible=1 AND ended_at<? AND attempt_id<>? LIMIT 1',quest.id,attempt.started_at,attempt.attempt_id);
   if(rematch) next=await award(db,next,'rematch:'+quest.id,STORY_REWARDS.rematch,'REMATCH_COMPLETED','REWANŻ UKOŃCZONY');
   await db.runAsync("UPDATE quest_attempts SET ended_at=?, result='COMPLETED', duration=?, distance=? WHERE attempt_id=? AND result IS NULL",nowISO(),evidence.durationSeconds,evidence.distanceMeters??0,evidence.attemptId);
 }
 if(quest.category==='BOSS') {
   const column=quest.id===BOSS_FOCUS?'focus_at':'move_at';
   await db.runAsync(`UPDATE boss_progress SET ${column}=? WHERE id=? AND ${column} IS NULL`,nowISO(),BOSS_ID);
   await storyEvent(db,'boss_stage_'+(column==='focus_at'?'1':'2'),'BOSS_STAGE_COMPLETED',`PIERWSZY MUR // ETAP ${column==='focus_at'?'1':'2'} UKOŃCZONY`);
 }
 if(quest.category==='DAILY') {
   const boss=await db.getFirstAsync<BossProgress>('SELECT * FROM boss_progress WHERE id=?',BOSS_ID);
   if(boss&&!boss.discipline_at) {
     const damage=dailyBossDamage(quest,player);
     if(damage>0) await db.runAsync(
       'INSERT INTO boss_contributions(quest_id,boss_id,damage,created_at) VALUES (?,?,?,?) ON CONFLICT(quest_id) DO NOTHING',
       quest.id,BOSS_ID,damage,nowISO()
     );
   }
   // At least the following local day: a missed day must not permanently lock a multi-day boss.
   if(boss?.move_at&&!boss.discipline_at&&quest.dayKey&&dayOrdinal(quest.dayKey)>dayOrdinal(boss.start_day)) {
     await db.runAsync('UPDATE boss_progress SET discipline_at=? WHERE id=?',nowISO(),BOSS_ID);
     await storyEvent(db,'boss_stage_3','BOSS_STAGE_COMPLETED','PIERWSZY MUR // ETAP 3 UKOŃCZONY');
   }
 }
 return next;
}
