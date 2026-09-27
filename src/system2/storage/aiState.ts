import type { SQLiteDatabase } from 'expo-sqlite';
import { consequenceForFailedDaily, consequenceForRecoverySuccess, type SystemDebt } from '../ai/consequences';

const KEY = 'ai_consequence_state_v1';

export type AIConsequenceState = {
  systemDebt: SystemDebt;
  lastDebtDay: string | null;
  updatedAt: string | null;
};

export const DEFAULT_AI_CONSEQUENCE_STATE: AIConsequenceState = {
  systemDebt: 0,
  lastDebtDay: null,
  updatedAt: null,
};

function parse(raw?: string): AIConsequenceState {
  if (!raw) return { ...DEFAULT_AI_CONSEQUENCE_STATE };
  try {
    const value = JSON.parse(raw) as Partial<AIConsequenceState>;
    const debt = Number(value.systemDebt);
    return {
      systemDebt: ([0,1,2,3].includes(debt) ? debt : 0) as SystemDebt,
      lastDebtDay: typeof value.lastDebtDay === 'string' ? value.lastDebtDay : null,
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
    };
  } catch {
    return { ...DEFAULT_AI_CONSEQUENCE_STATE };
  }
}

async function write(db: SQLiteDatabase, state: AIConsequenceState) {
  await db.runAsync(
    'INSERT INTO app_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    KEY,
    JSON.stringify(state),
  );
}

export async function readAIConsequenceState(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{value:string}>('SELECT value FROM app_state WHERE key=?', KEY);
  return parse(row?.value);
}

export async function applyMissedDailyConsequence(db: SQLiteDatabase, currentDay: string) {
  const state = await readAIConsequenceState(db);
  const previous = await db.getFirstAsync<{day_key:string}>(
    'SELECT day_key FROM daily_sets WHERE day_key < ? ORDER BY day_key DESC LIMIT 1',
    currentDay,
  );
  if (!previous || (state.lastDebtDay && state.lastDebtDay >= previous.day_key)) return state;

  const failures = await db.getFirstAsync<{n:number}>(
    `SELECT COUNT(DISTINCT a.quest_id) AS n
     FROM quest_attempts a
     JOIN daily_instances d ON d.id=a.quest_id
     WHERE d.day_key=? AND a.eligible=1
       AND a.result IN ('FAILED','REJECTED','INTERRUPTED','SUSPICIOUS')`,
    previous.day_key,
  );
  const eligibleFailures = failures?.n ?? 0;
  let debt = state.systemDebt;
  if (eligibleFailures > 0) {
    debt = consequenceForFailedDaily(state.systemDebt, eligibleFailures).systemDebt;
  }
  const next = {
    systemDebt: debt,
    lastDebtDay: previous.day_key,
    updatedAt: new Date().toISOString(),
  };
  await write(db, next);
  return next;
}

export async function clearAIConsequenceDebt(db: SQLiteDatabase) {
  const state = await readAIConsequenceState(db);
  if (!state.systemDebt) return state;
  const recovery = consequenceForRecoverySuccess();
  const next = {
    ...state,
    systemDebt: recovery.systemDebt,
    updatedAt: new Date().toISOString(),
  };
  await write(db, next);
  return next;
}
