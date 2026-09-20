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

  const counts = await db.getFirstAsync<{total:number;completed:number}>(
    `SELECT COUNT(d.id) AS total,
      SUM(CASE WHEN c.quest_id IS NOT NULL THEN 1 ELSE 0 END) AS completed
     FROM daily_instances d
     LEFT JOIN quest_completions c ON c.quest_id=d.id
     WHERE d.day_key=?`,
    previous.day_key,
  );
  const total = counts?.total ?? 0;
  const completed = counts?.completed ?? 0;
  let debt = state.systemDebt;
  if (total > 0 && completed < total) {
    debt = consequenceForFailedDaily(state.systemDebt, total - completed).systemDebt;
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
