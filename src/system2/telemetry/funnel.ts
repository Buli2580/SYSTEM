export type FunnelEvent=import('../gameLoop/telemetry').GameLoopTelemetryEvent
  |'GM_DECISION'|'GM_FALLBACK'|'GM_COMEBACK'|'GM_RECOVERY_QUEST'
  |'APP_OPEN'|'ONBOARDING_START'|'ONBOARDING_COMPLETE'
  |'QUEST_BRIEFING_VIEW'|'QUEST_START'|'QUEST_ABORT'|'QUEST_COMPLETE'
  |'VERIFY_START'|'VERIFY_FAIL'|'VERIFY_SUCCESS'
  |'RECOVERY_OFFERED'|'RECOVERY_ACCEPTED'|'REROLL'
  |'BOSS_HIT'|'BOSS_PHASE_CHANGE'|'BOSS_DEFEATED'
  |'WORLD_EVENT_OPEN'|'WORLD_EVENT_COMPLETE'
  |'CARD_SHARE'|'STREAK_RISK'|'STREAK_LOST'
  |'PERK_UNLOCK'|'PERK_USED'
  |'GM_CAMPAIGN_CREATE'|'ONLINE_OPEN'|'SPONSOR_CHALLENGE_OPEN';

export type FunnelSignal={
  event:FunnelEvent;
  at:string;
  properties?:Record<string,string|number|boolean>;
};

export function signal(event:FunnelEvent,properties?:FunnelSignal['properties']):FunnelSignal{
  return{event,at:new Date().toISOString(),...(properties?{properties}:{})};
}
