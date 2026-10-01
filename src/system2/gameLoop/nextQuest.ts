import type { GameMasterDecision } from '../gameMaster/director';
export type LoopNextQuest={questId:string|null;title:string;reason:string;autoStart:false};
export function nextQuestFromDirector(decision:GameMasterDecision):LoopNextQuest{
 return decision.quest
 ? {questId:decision.quest.id,title:decision.quest.title,reason:decision.message,autoStart:false}
 : {questId:null,title:'SYSTEM READY',reason:decision.message,autoStart:false};
}
