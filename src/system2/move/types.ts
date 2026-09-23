export type MoveAgeMode='UNDER_6'|'AGE_6_8'|'AGE_9_12'|'AGE_13_17'|'ADULT'|'UNKNOWN';
export type MovementSkillKey='SPEED'|'BALANCE'|'COORDINATION'|'JUMP'|'THROW'|'CATCH'|'ENDURANCE';
export type MoveQuestKind='RUN'|'WALK'|'BIKE'|'BALANCE'|'JUMP'|'BALL'|'OUTDOOR'|'FAMILY';
export type MoveVerification='TIMER'|'GPS_DISTANCE'|'STEPS'|'PARENT_APPROVAL'|'MIXED';
export type MoveDifficulty='EASY'|'NORMAL'|'CHALLENGE';
export type MoveQuest={
  id:string;title:string;description:string;kind:MoveQuestKind;minutes:number;
  skills:MovementSkillKey[];verification:MoveVerification;difficulty:MoveDifficulty;
  ageModes:MoveAgeMode[];outdoor:boolean;familyEligible:boolean;
};
export type MovementSkillProgress={key:MovementSkillKey;level:number;xp:number;xpToNext:number};
export type MoveDayPlan={dayKey:string;ageMode:MoveAgeMode;quests:MoveQuest[];targetMinutes:number;plannedMinutes:number;recovery:boolean};
export type MoveEventKind='RUN_SIGNAL'|'JUMP_ANOMALY'|'OUTDOOR_PORTAL'|'BIKE_EVENT'|'BALL_CHALLENGE';
export type MoveWorldEvent={id:string;kind:MoveEventKind;title:string;minutes:number;endsAt:string;skill:MovementSkillKey};
