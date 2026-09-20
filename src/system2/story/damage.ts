import type { RunnableQuest } from '../quests/types';
import type { PlayerProfile } from '../core';
import type { BossProgress } from './types';
export function dailyBossDamage(quest:RunnableQuest,player:PlayerProfile) {
 if(quest.category!=='DAILY')return 0;
 return Math.min(8,({EASY:2,NORMAL:3,HARD:5,EXTREME:5})[quest.difficulty]+(quest.verification.type==='TIMER'?0:1)+Math.min(2,Math.floor(player.realLevel/10)));
}
export function bossHealth(boss:BossProgress|null|undefined,support=0) {
 if(!boss)return 100;
 if(boss.focus_at&&boss.move_at&&boss.discipline_at)return 0;
 return Math.max(1,100-(boss.focus_at?30:0)-(boss.move_at?40:0)-Math.min(20,Math.max(0,support)));
}
