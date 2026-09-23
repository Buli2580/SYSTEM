import type {SystemSnapshot} from '../storage/database';
import type {QuestReward} from '../core';
import {AWAKENING_QUESTS,getQuest} from '../quests/catalog';
import {primaryJourney,stageRequirement,journeyPlan} from '../journeys/model';
import {dayKey} from '../daily/calendar';
import {adaptiveDifficulty} from '../generation/engine';
import {DEFAULT_ACTIVITIES} from '../daily/templates';
import {activeWorldEvent,worldEventDirectorLine} from '../world/events';
export type DirectorState=Pick<SystemSnapshot,'awakeningCompleted'|'completedQuestIds'|'daily'|'goals'|'story'|'journeys'|'journeyQuestIds'|'recentActivity'> & Partial<Pick<SystemSnapshot,'player'>>;
export type Directive={kind:'AWAKENING'|'ACTIVE_QUEST'|'CREATE_GOAL'|'CONTINUE_JOURNEY'|'COMPLETE_DAILY'|'RECOVER_MOMENTUM'|'DEVELOP_WEAK_STAT'|'ADVANCE_WEEKLY'|'CHALLENGE_BOSS'|'WORLD_EVENT'|'REVIEW_GOAL'|'REST'|'CLOCK';title:string;objective:string;reason:string;route:'/quest'|'/quests'|'/goals'|'/story'|'/world';questId?:string;journeyId?:string;reward?:QuestReward};
export function directSystem(s:DirectorState,activeQuestId:string|null,now=Date.now()):Directive{
 const goals=s.goals??[],primary=primaryJourney(s.journeys??[],goals),goal=goals.find(g=>g.id===primary?.goalId);
 const pick=(kind:Directive['kind'],title:string,reason:string,route:Directive['route'],questId?:string):Directive=>{
  const linked=(s.journeys??[]).find(j=>j.id===(questId?s.journeyQuestIds?.[questId]:undefined));
  const objective=kind==='CHALLENGE_BOSS'?'THE FIRST WALL':kind==='ADVANCE_WEEKLY'?'WEEKLY PROTOCOL':kind==='AWAKENING'?'PIERWSZE PRZEBUDZENIE':goals.find(g=>g.id===linked?.goalId)?.title??(kind==='CONTINUE_JOURNEY'?goal?.title:undefined)??'SYSTEM PROGRESSION';
  return {kind,title,objective,reason,route,...(questId?{questId,reward:getQuest(questId)?.rewards}:{}),...(linked?{journeyId:linked.id}:{})};
 };
 if(!s.awakeningCompleted){const q=AWAKENING_QUESTS.find(q=>!s.completedQuestIds.includes(q.id));return pick('AWAKENING','AWAKENING','Najpierw ukończ pierwsze przebudzenie.','/quest',q?.id);}
 if(activeQuestId&&!s.completedQuestIds.includes(activeQuestId))return pick('ACTIVE_QUEST','CONTINUE ACTIVE QUEST',getQuest(activeQuestId)?.title??'Aktywna misja','/quest',activeQuestId);
 if(!goals.some(g=>g.status==='ACTIVE'))return pick('CREATE_GOAL','SET YOUR FIRST GOAL','Wskaż kierunek lub wznów cel. Daily nadal są dostępne.','/goals');
 if(s.daily?.clockAnomaly||(s.daily?.dayKey&&s.daily.dayKey!==dayKey(now)))return pick('CLOCK','ODŚWIEŻ DAILY','Sprawdź datę i odśwież zapisane misje.','/quests');
 const available=(s.daily?.questIds??[]).filter(id=>!!getQuest(id)&&!s.completedQuestIds.includes(id));
 const recovery=s.player&&adaptiveDifficulty({player:s.player,goals,history:s.recentActivity??[],day:dayKey(now),prefs:DEFAULT_ACTIVITIES,weeklyCompleted:s.daily?.weeklyCompleted??0,weeklyClear:s.daily?.weeklyClear??false}).recovery;
 if(recovery){const id=available.find(id=>id.includes('focus_return_easy'))??available.find(id=>getQuest(id)?.difficulty==='EASY');if(id)return pick('RECOVER_MOMENTUM','RECOVER MOMENTUM','Mały krok. Nie zwiększamy teraz trudności.','/quest',id);if(available.length)return pick('RECOVER_MOMENTUM','RECOVER MOMENTUM','Brak łatwej misji w zapisanym zestawie. Możesz odpocząć; następny zestaw uwzględni ostatnie próby.','/quests');}
 const worldEvent=s.player?activeWorldEvent(s.player,s.awakeningCompleted,now):null;
 if(worldEvent)return pick('WORLD_EVENT',worldEventDirectorLine(worldEvent,now),worldEvent.subtitle,'/world');
 if(primary){const id=available.find(id=>s.journeyQuestIds?.[id]===primary.id);if(id){const stage=journeyPlan(primary.category)[primary.currentStage];return pick('CONTINUE_JOURNEY','CONTINUE JOURNEY',`${stage.name} · ${stageRequirement(primary)}`,'/quest',id);}}
 if(s.daily?.weeklyCompleted===4&&!s.daily.weeklyClear&&available[0])return pick('ADVANCE_WEEKLY','COMPLETE WEEKLY OBJECTIVE','Jeszcze jeden zweryfikowany Daily do Weekly.','/quest',available[0]);
 if(s.story?.worldLinkComplete&&!s.story.bossComplete){const b=s.story.boss;if(!b||!b.focus_at||!b.move_at||available.length>0&&s.daily?.dayKey&&s.daily.dayKey>b.start_day)return pick('CHALLENGE_BOSS',b?'BOSS PROTOCOL':'BOSS AVAILABLE','FOCUS → MOVE → DISCIPLINE. Zobacz dostępny etap.','/story');}
 if(s.player&&available.length&&goals.length){const skills=Object.values(s.player.stats).map(v=>v.level),min=Math.min(...skills),max=Math.max(...skills);const id=available.find(id=>{const q=getQuest(id);return q&&s.player!.stats[q.primarySkill].level===min;});if(id&&max-min>=2&&Number(dayKey(now).slice(-2))%3===0)return pick('DEVELOP_WEAK_STAT','DEVELOP WEAK STAT',`Spokojny rozwój ${getQuest(id)!.primarySkill}.`,'/quest',id);}
 if(available[0])return pick('COMPLETE_DAILY','START DAILY QUEST',s.daily?.reasons?.[available[0]]??'Kolejny zweryfikowany krok.','/quest',available[0]);
 if((s.journeys??[]).some(j=>j.status==='COMPLETED'&&goals.some(g=>g.id===j.goalId&&g.status==='ACTIVE')))return pick('REVIEW_GOAL','OCEŃ SWÓJ CEL','Journey ukończone. Osiągnięcie osobistego rezultatu potwierdzasz samodzielnie.','/goals');
 return pick('REST','DAILY COMPLETE',primary?'Dzisiejsze sesje zakończone. Journey kontynuujesz z kolejnym zestawem.':'Następny zestaw jutro.','/quests');
}
