import type { GameLoopState } from './stateMachine';

export type GameLoopPrimaryAction =
  | 'ENTER_SYSTEM' | 'START_MISSION' | 'CONTINUE_MISSION' | 'VERIFY'
  | 'CLAIM_XP' | 'REVEAL_LOOT' | 'CONTINUE_LEVEL_UP' | 'EQUIP_OR_CONTINUE'
  | 'CONTINUE_WORLD' | 'NEXT_MISSION' | 'RESUME_MISSION';

export type GameLoopCTA={action:GameLoopPrimaryAction;label:string;disabled:boolean};

export function primaryGameLoopCTA(state:GameLoopState):GameLoopCTA{
 switch(state.phase){
  case 'HOME': return {action:'ENTER_SYSTEM',label:'ENTER SYSTEM',disabled:false};
  case 'BRIEFING': return {action:'START_MISSION',label:'START MISSION',disabled:false};
  case 'STARTING': return {action:'CONTINUE_MISSION',label:'STARTING…',disabled:true};
  case 'ACTIVE': return {action:'CONTINUE_MISSION',label:'CONTINUE MISSION',disabled:false};
  case 'VERIFYING': return {action:'VERIFY',label:'VERIFYING…',disabled:true};
  case 'COMPLETING': return {action:'VERIFY',label:'SAVING REWARD…',disabled:true};
  case 'XP_REWARD': return {action:'CLAIM_XP',label:'CONTINUE',disabled:false};
  case 'LOOT_REWARD': return {action:'REVEAL_LOOT',label:'REVEAL LOOT',disabled:false};
  case 'LEVEL_UP': return {action:'CONTINUE_LEVEL_UP',label:'CONTINUE',disabled:false};
  case 'EQUIP': return {action:'EQUIP_OR_CONTINUE',label:'EQUIP / CONTINUE',disabled:false};
  case 'WORLD_REACTION': return {action:'CONTINUE_WORLD',label:'CONTINUE',disabled:false};
  case 'NEXT_QUEST': return {action:'NEXT_MISSION',label:'NEXT MISSION',disabled:false};
  case 'RECOVERY': return {action:'RESUME_MISSION',label:'RESUME MISSION',disabled:!state.questId};
 }
}
