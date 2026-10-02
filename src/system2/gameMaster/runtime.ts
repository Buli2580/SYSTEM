import {isSafeAwakening} from '../quests/safeAwakening';
import {directNextMission} from './director';
import {getQuest} from '../quests/catalog';
import {questAvailability} from '../quests/availability';
import {generatedQuest,templateFor} from '../generation/templates';
import {independentDailyAllowed,moveSafetyPolicy} from '../move/safety';
import {moveAgeMode} from '../move/age';
import {newUserModel,planAdaptiveDay,recordOutcome} from '../adaptive/engine';
import {archetypeForPlayer,playerPerks} from '../progression/perks';
import {activeWorldEvent} from '../world/events';
import {primaryJourney} from '../journeys/model';
import {BOSS_FOCUS,BOSS_WALK,BOSS_RUN} from '../story/catalog';
import {semanticQuest} from './history';
import {getCampaignState} from './campaignStore';
import type {SystemSnapshot} from '../storage/database';
import type {RunnableQuest} from '../quests/types';
import type {CampaignState,MissionOutcome,MissionDirective,WorldDirectives,BossDirectives,CharacterReaction} from './types';
export type GameMasterInput=Parameters<typeof directNextMission>[0]&{
 campaign:CampaignState;history:readonly MissionOutcome[];now:string;hour:number;
 worldUnlocked?:boolean;goals?:SystemSnapshot['goals'];journeys?:SystemSnapshot['journeys'];
 settings?:SystemSnapshot['settings'];victory?:boolean;levelUp?:boolean;
};
export function getGameMasterState(input:GameMasterInput) {
 const now=Date.parse(input.now);if(!Number.isFinite(now))throw new Error('GM_INVALID_TIME');
 const history=input.history.filter(h=>Date.parse(h.at)<=now).slice().sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));
 const behavioral=history.filter(h=>h.result!=='TECHNICAL');
 let model={...newUserModel(input.now),lifeState:input.adaptiveModel?.lifeState??'NORMAL' as const,availableMinutes:input.adaptiveModel?.availableMinutes??45,preferredDifficulty:input.adaptiveModel?.preferredDifficulty??2};
 for(const h of behavioral) model=recordOutcome(model,{id:h.id,questType:h.family,difficulty:h.difficulty,at:h.at,minutes:h.minutes,outcome:h.result==='COMPLETED'?(h.verification!==null&&h.verification>=70?'COMPLETE':'PARTIAL'):'FAILED'});
 const plan=planAdaptiveDay(model,input.now);
 const last=history.at(-1),comeback=!!last&&now-Date.parse(last.at)>=4*86400000;
 const week=behavioral.filter(h=>now-Date.parse(h.at)<=7*86400000);
 const overload=week.slice(-5).filter(h=>h.result!=='COMPLETED'||(h.plannedMinutes>0&&h.minutes>h.plannedMinutes*2)).length>=2;
 // A new player's zero streak is not a broken streak. Same-session successes must not lock Awakening.
 const priorDaySuccess=behavioral.some(h=>h.result==='COMPLETED'&&now-Date.parse(h.at)>=86400000);
 const recovery=!comeback&&(input.player.streak===0&&priorDaySuccess||overload||model.lifeState==='RECOVERY');
 const maxDifficulty=comeback||recovery?1:plan.difficulty;
 const age=moveAgeMode(input.player.birthDate,new Date(input.now));
 const ageMax=age==='ADULT'?5:age==='AGE_13_17'?2:1;
 const difficulty=Math.min(maxDifficulty,ageMax);
 const ageMinutes=age==='UNKNOWN'||age==='UNDER_6'?5:moveSafetyPolicy(age).maxSingleQuestMinutes;
 const campaign=getCampaignState(input.campaign,input.now);
 const journey=primaryJourney(input.journeys??[],input.goals??[]);
 const desiredStat=input.campaign.choice==='MOTION'?'VIT':input.campaign.choice==='FOCUS'?'INT':'WIL';
 const archetype=archetypeForPlayer(input.player),perks=playerPerks(input.player,overload).filter(p=>p.active).map(p=>p.id);
 const worldEvent=activeWorldEvent(input.player,!!input.worldUnlocked,now);
 // Existing Director retains active/awakening ordering. Candidates are real, persisted quests.
 const base=directNextMission({...input,recentAttempt:undefined,recentAttempts:[],socialSignal:null});
 const bossStage=input.story?.worldLinkComplete&&!input.story?.bossComplete&&input.story?.boss;
 const bossIds:string[]=bossStage?(!bossStage.focus_at?[BOSS_FOCUS]:!bossStage.move_at?[BOSS_WALK,BOSS_RUN]:[]):[];
 const ids=[...(base.quest?[base.quest.id]:[]),...(input.daily?.questIds??[]),...bossIds];
 const candidates=[...new Set(ids)].flatMap(id=>{
  let q=getQuest(id,input.story?.boss?.difficulty);if(!q)return [];
  if(q.category==='BOSS'&&!bossIds.includes(id))return [];
  if(!questAvailability(id,{completedQuestIds:input.completedQuestIds,activeQuestId:input.activeQuestId,daily:input.daily,bossAccessible:!!input.story?.worldLinkComplete&&!input.story?.bossComplete}).canComplete)return [];
  const meta=semanticQuest(q),template=templateFor(id);
  if(age!=='ADULT') {
   if((!isSafeAwakening(id)&&(!template||!independentDailyAllowed(template,age)))||q.verification.type!=='TIMER'||q.difficulty==='HARD'||q.difficulty==='EXTREME'||meta.difficulty>ageMax||meta.plannedMinutes>ageMinutes)return [];
   // Stored AI wording is never trusted for a minor. Keep canonical mechanics and curated copy.
   q=generatedQuest(q.id)??q;
  }
  if(q.activityType&&input.settings?.activities){const enabled=q.activityType==='WALK'?input.settings.activities.walking:q.activityType==='RUN'?input.settings.activities.running:input.settings.activities.cycling;if(!enabled)return [];}
  if(meta.difficulty>difficulty&&q.id!==input.activeQuestId)return [];
  if(meta.plannedMinutes>model.availableMinutes&&q.id!==input.activeQuestId)return [];
  return [q];
 });
 const recent=history.filter(h=>now-Date.parse(h.at)<2*86400000&&h.result!=='TECHNICAL');
 const fresh=candidates.filter(q=>!recent.some(h=>h.signature===semanticQuest(q).signature));
 const locked=base.quest&&(base.reason==='ACTIVE'||!input.awakeningCompleted)?candidates.find(q=>q.id===base.quest!.id):undefined;
 const score=(q:RunnableQuest)=>{
  const m=semanticQuest(q),t=templateFor(q.id);
  return -Math.abs(m.difficulty-difficulty)*30 + (q.primarySkill===desiredStat?18:0)
   +(q.category==='BOSS'&&!comeback&&!recovery?100:0)
   +(journey&&t?.goals.includes(journey.category)?24:0)
   +Math.max(0,10-input.player.stats[q.primarySkill].level)*2
   +(model.preferredTypes.includes(m.family)?6:0)
   +(archetype==='VANGUARD'&&q.activityType?4:archetype==='TACTICIAN'&&q.primarySkill==='INT'?4:0)
   +(perks.includes('FOCUS_SURGE')&&q.primarySkill==='WIL'?4:0)
   +(worldEvent?.recommendedAction==='MOVE'&&q.activityType?5:0)
   +(campaign.phase==='REVIEW'&&['focus_reflect','focus_evening','focus_review'].includes(t?.id??'')?8:0)
   -recent.filter(h=>h.family===m.family).length*12
   +(campaign.stage===1&&['INT','WIL'].includes(q.primarySkill)?8:0)
   +(campaign.stage===3&&q.primarySkill==='RES'?8:0)
   +(campaign.stage===5&&['focus_reflect','focus_evening','focus_review'].includes(t?.id??'')?20:0)
   -((comeback||recovery)?m.plannedMinutes*3:0);
 };
 const ranked=fresh.slice().sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
 const quest=locked??ranked[0]??null;
 const reason=locked?base.message:!quest?'Brak bezpiecznej dostępnej misji poza cooldownem. Sprawdź cele lub uprawnienia.':comeback?'Powrót po przerwie: mały krok, bez nadrabiania zaległości.':recovery?'Spokojna misja regeneracyjna po trudnościach.':`${campaign.arc} · ${campaign.chain} · etap ${campaign.stage}. Kierunek ${input.campaign.choice}; rozwój ${quest.primarySkill}.`;
 const diversity=week.length?new Set(week.map(h=>h.signature)).size/week.length:1;
 const mission:MissionDirective={quest,reason,campaign,difficulty,readiness:comeback?40:recovery?Math.min(40,plan.readiness):plan.readiness,recovery,comeback,diversity,nextPossibleQuestIds:ranked.map(q=>q.id)};
 const storyBoss=!!input.awakeningCompleted&&!!input.story?.worldLinkComplete&&!input.story?.bossComplete;
 const eventBoss=worldEvent?.kind==='MINI_BOSS'||worldEvent?.kind==='ELITE_ENEMY';
 const presence=storyBoss||eventBoss;
 const reaction:WorldDirectives['reaction']=input.victory?'VICTORY':!input.awakeningCompleted?'AWAKENING':comeback?'COMEBACK':recovery?'RECOVERY':presence?'BOSS':worldEvent?.threat===3?'THREAT':worldEvent?'TENSION':'NORMAL';
 const threat:0|1|2|3=comeback||recovery?0:presence?3:worldEvent?.threat??0;
 const world:WorldDirectives={reaction,threat,weather:threat>=3?'ASH':threat>=1?'MIST':'CLEAR',lighting:input.victory||comeback?'WARM':input.hour<6||input.hour>=19?'NIGHT':'DAY',tier:input.player.realLevel>=25?3:input.player.realLevel>=10?2:1,missionSignal:quest?.id??null};
 const boss:BossDirectives={presence,threat,reaction:input.story?.bossComplete&&!eventBoss?'DEFEATED':presence?(threat===3?'CHALLENGE':'WATCHING'):'DORMANT',campaignRelevance:campaign.longArc+' / '+campaign.arc+' / '+campaign.phase,source:storyBoss?'STORY':eventBoss?'WORLD_EVENT':'NONE'};
 const character:CharacterReaction=input.levelUp?'LEVEL_UP':input.victory?'VICTORY':recovery?'RECOVERY':comeback?'READY':threat>=3?'THREAT':input.activeQuestId?'READY':'IDLE';
 const explanation=[reason,`Readiness ${mission.readiness}; difficulty ${difficulty}; diversity ${Math.round(diversity*100)}%.`, `Archetype ${archetype}; perks ${perks.join(', ')||'none'}.`, `Weekly ${input.daily?.weeklyCompleted??0}/${input.daily?.weeklyTarget??5}; ${campaign.prepares}.`,journey?`Journey ${journey.id} etap ${journey.currentStage+1}.`:'',`Consequence ${campaign.consequence}.`].filter(Boolean);
 // Local, bounded decision telemetry contains no free-text goal, identity or raw evidence.
 const telemetry={version:4,mode:reaction,reason:locked?base.reason:quest?'CAMPAIGN':'NO_SAFE_CANDIDATE',direction:campaign.choice,phase:campaign.phase,selectedSkill:quest?.primarySkill??'NONE',candidateCount:candidates.length,readiness:mission.readiness,difficulty,diversity,technicalExcluded:history.length-behavioral.length};
 return {mission,campaign,world,boss,character,explanation,telemetry};
}
export type GameMasterState=ReturnType<typeof getGameMasterState>;
export const getNextMission=(state:GameMasterState)=>state.mission;
export const getWorldDirectives=(state:GameMasterState)=>state.world;
export const getBossDirectives=(state:GameMasterState)=>state.boss;
export const getCharacterDirectives=(state:GameMasterState)=>state.character;
export const getDecisionExplanation=(state:GameMasterState)=>state.explanation;
