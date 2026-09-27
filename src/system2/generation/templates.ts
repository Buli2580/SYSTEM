import type { SkillKey, QuestDifficulty } from '../core';
import type { GoalCategory } from '../goals/model';
import type { RunnableQuest } from '../quests/types';
export type QuestTheme = 'FITNESS'|'DISCIPLINE'|'PRODUCTIVITY'|'LEARNING'|'SOCIAL'|'LIFESTYLE'|'GENERAL';
export type GeneratedDifficulty = Exclude<QuestDifficulty,'EXTREME'>;
export type QuestTemplate = {id:string;category:QuestTheme;titlePattern:string;descriptionPattern:string;stat:SkillKey;goals:readonly GoalCategory[];minimumLevel:number;cooldownDays:number;verification:'TIMER'|'GPS_DISTANCE';activity?:'WALK'|'RUN'|'BIKE';baseTarget:number};
const rows: [string,QuestTheme,string,string,SkillKey,GoalCategory[]][] = [
 ['walk_reset','FITNESS','RESET WALK','Spokojny spacer we własnym tempie.','VIT',['FITNESS','LIFESTYLE']],
 ['walk_fresh','FITNESS','FRESH AIR','Przejdź bezpieczną, znajomą trasę.','VIT',['FITNESS']],
 ['walk_break','FITNESS','ACTIVE BREAK','Zrób przerwę na spokojny spacer.','VIT',['FITNESS','PRODUCTIVITY']],
 ['walk_route','FITNESS','FAMILIAR ROUTE','Przejdź znaną trasę bez pośpiechu.','VIT',['FITNESS','DISCIPLINE']],
 ['run_easy','FITNESS','EASY RUN','Lekki bieg tylko jeśli czujesz się na siłach.','VIT',['FITNESS']],
 ['ride_easy','FITNESS','EASY RIDE','Spokojna jazda bez obsługi telefonu w ruchu.','VIT',['FITNESS']],
 ['focus_strength','FITNESS','STRENGTH PLAN','Zaplanuj znaną Ci, łagodną sesję ćwiczeń; uwzględnij odpoczynek.','INT',['STRENGTH']],
 ['focus_mobility','FITNESS','MOVEMENT PLAN','Przeznacz sesję na plan regularnych przerw od siedzenia.','WIL',['FITNESS','STRENGTH']],
 ['focus_begin','DISCIPLINE','FIRST SMALL STEP','Wybierz odkładane zadanie i zacznij od najmniejszego kroku.','WIL',['DISCIPLINE']],
 ['focus_morning','DISCIPLINE','MORNING INTENT','Przygotuj jeden prosty zamiar na początek kolejnego dnia.','WIL',['DISCIPLINE','LIFESTYLE']],
 ['focus_evening','DISCIPLINE','EVENING REVIEW','Przejrzyj dzień i wybierz jedną rzecz do powtórzenia.','WIL',['DISCIPLINE']],
 ['focus_distraction','DISCIPLINE','QUIET BLOCK','Odłóż rozpraszacze i pracuj nad jednym zadaniem.','WIL',['DISCIPLINE','PRODUCTIVITY']],
 ['focus_return','DISCIPLINE','RETURN TO THE SYSTEM','Wróć łagodnie: wybierz jeden mały krok. Bez nadrabiania zaległości.','WIL',['DISCIPLINE','GENERAL']],
 ['focus_priority','PRODUCTIVITY','ONE PRIORITY','Przeznacz sesję na jedną najważniejszą sprawę.','WIL',['PRODUCTIVITY']],
 ['focus_backlog','PRODUCTIVITY','SMALL BACKLOG','Uporządkuj krótki fragment listy zaległości.','RES',['PRODUCTIVITY']],
 ['focus_plan','PRODUCTIVITY','NEXT STEP','Rozpisz następny wykonalny krok swojego projektu.','INT',['PRODUCTIVITY']],
 ['focus_draft','PRODUCTIVITY','FIRST DRAFT','Przygotuj roboczą wersję jednego fragmentu pracy.','CRE',['PRODUCTIVITY']],
 ['focus_review','PRODUCTIVITY','WORK REVIEW','Przejrzyj ukończony fragment i zaznacz potrzebną poprawkę.','INT',['PRODUCTIVITY']],
 ['learn_read','LEARNING','READ AND NOTE','Czytaj wybrany materiał i zapisz jedną myśl.','INT',['LEARNING']],
 ['learn_recall','LEARNING','ACTIVE RECALL','Spróbuj odtworzyć poznane informacje z pamięci.','INT',['LEARNING']],
 ['learn_language','LEARNING','LANGUAGE BLOCK','Ćwicz materiał w wybranym języku na swoim poziomie.','INT',['LEARNING']],
 ['learn_question','LEARNING','ONE QUESTION','Znajdź odpowiedź na jedno pytanie w przygotowanych materiałach.','INT',['LEARNING']],
 ['learn_explain','LEARNING','EXPLAIN SIMPLY','Opisz własnymi słowami jeden poznany temat.','INT',['LEARNING']],
 ['focus_social_plan','SOCIAL','CONVERSATION PLAN','Przygotuj życzliwe pytanie do osoby, z którą chcesz porozmawiać.','CHA',['SOCIAL']],
 ['focus_social_message','SOCIAL','RECONNECT','Przygotuj krótką wiadomość do znajomej osoby; wysłanie jest dobrowolne.','CHA',['SOCIAL']],
 ['focus_social_listen','SOCIAL','LISTENING INTENT','Zastanów się, jak lepiej słuchać w kolejnej rozmowie.','CHA',['SOCIAL']],
 ['focus_social_thanks','SOCIAL','GRATITUDE NOTE','Ułóż szczere podziękowanie bez presji na kontakt.','CHA',['SOCIAL']],
 ['organize_space','LIFESTYLE','SMALL SPACE','Uporządkuj niewielki fragment swojego otoczenia.','RES',['LIFESTYLE']],
 ['organize_tomorrow','LIFESTYLE','READY FOR TOMORROW','Przygotuj potrzebne rzeczy na kolejny dzień.','RES',['LIFESTYLE','DISCIPLINE']],
 ['organize_routine','LIFESTYLE','ROUTINE PLAN','Wybierz prosty nawyk i ustal dogodny moment.','WIL',['LIFESTYLE']],
 ['organize_files','LIFESTYLE','DIGITAL ORDER','Uporządkuj małą grupę własnych notatek lub plików.','RES',['LIFESTYLE','PRODUCTIVITY']],
 ['create_note','GENERAL','SYSTEM NOTE','Zapisz jeden pomysł, który chcesz rozwinąć.','CRE',['GENERAL']],
 ['focus_direction','GENERAL','FIND DIRECTION','Przeznacz sesję na wybór małego osobistego celu.','WIL',['GENERAL']],
 ['create_sketch','GENERAL','SMALL CREATION','Rozwiń jeden pomysł w szkicu lub kilku zdaniach.','CRE',['GENERAL']],
 ['focus_reflect','GENERAL','REFLECTION','Zapisz, co pomogło Ci ostatnio działać.','WIL',['GENERAL']],
];
export const QUEST_TEMPLATES: readonly QuestTemplate[] = rows.map(([id,category,title,description,stat,goals])=>({id,category,titlePattern:title,descriptionPattern:description+' Cel sesji: {target}.',stat,goals,minimumLevel:1,cooldownDays:2,verification:/^(walk|run|ride)_/.test(id)?'GPS_DISTANCE':'TIMER',activity:id.startsWith('walk_')?'WALK':id.startsWith('run_')?'RUN':id.startsWith('ride_')?'BIKE':undefined,baseTarget:id.startsWith('ride_')?1500:id.startsWith('run_')?500:id.startsWith('walk_')?600:300}));
export const DIFFICULTY = {EASY:{factor:1,xp:30,statXp:25,energy:3,minLevel:1},NORMAL:{factor:1.5,xp:50,statXp:40,energy:5,minLevel:3},HARD:{factor:2,xp:75,statXp:60,energy:7,minLevel:8}} as const;
// Versioned IDs keep old saves/rewards stable when future template versions arrive.
export function generatedQuest(id:string):RunnableQuest|undefined {
 const m=/^daily:(\d{4}-\d{2}-\d{2}):g1_([a-z0-9_]+)_(easy|normal|hard)(?::a1:([1-5]):([1-9]\d{0,4}))?$/.exec(id);
 if(!m)return undefined;const t=QUEST_TEMPLATES.find(t=>t.id===m[2]);if(!t)return undefined;
 const difficulty=m[3].toUpperCase() as GeneratedDifficulty,p=DIFFICULTY[difficulty],baseTarget=t.baseTarget*p.factor;
 const target=m[5]?Number(m[5]):baseTarget; if(target>baseTarget)return undefined;
 return {id,...(m[4]?{adaptiveDifficulty:Number(m[4])}:{}),templateId:'g1_'+t.id+'_'+m[3],dayKey:m[1],title:t.titlePattern,description:t.descriptionPattern.replace('{target}',t.verification==='TIMER'?`${target/60} min`:`${target} m`)+(t.verification==='TIMER'?' Timer potwierdza wyłącznie czas sesji na pierwszym planie, nie wykonanie zadania ani jego jakość.':' Dystans weryfikuje GPS na pierwszym planie.'),category:'DAILY',difficulty,primarySkill:t.stat,secondarySkills:[],order:0,arc:'DAILY',activityType:t.activity,verificationStrength:'STANDARD',verification:t.verification==='TIMER'?{type:'TIMER',minimumDurationSeconds:target,verificationScoreRequired:100}:{type:'GPS_DISTANCE',minimumDistanceMeters:target,verificationScoreRequired:70},rewards:{realXp:p.xp,skillXp:{[t.stat]:p.statXp},gameEnergy:p.energy},progress:0,progressTarget:target,createdAt:m[1]+'T00:00:00.000Z'};
}
export function templateFor(id:string){return QUEST_TEMPLATES.find(t=>id.includes(':g1_'+t.id+'_'));}
