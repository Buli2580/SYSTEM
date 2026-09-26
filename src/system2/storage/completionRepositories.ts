import { readBossDifficulty } from '../adaptive/storage';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { PlayerProfile } from '../core/types';
import type { CompletionTransaction, CompletionEffects } from '../repositories/contracts';
import { completionOperation } from '../repositories/contracts';
import type { QuestAccess } from '../quests/availability';
import { getQuest } from '../quests/catalog';

// All methods use the supplied transaction handle; never open their own connection.
export function completionRepositories<T>(db: SQLiteDatabase, readPlayer: () => Promise<PlayerProfile>,
  availability: (id: string) => Promise<QuestAccess>, effects: CompletionEffects<T>): CompletionTransaction<T> {
  return {
    players: {
      get: readPlayer,
      async save(player) { await db.runAsync('UPDATE app_state SET value = ? WHERE key = ?', JSON.stringify(player), 'player'); },
    },
    quests: {
      async get(id) { return getQuest(id, await readBossDifficulty(db)); }, availability,
      async claimCompletion(id, now) {
        const claim = await db.runAsync('INSERT INTO quest_completions (quest_id, completed_at) VALUES (?, ?) ON CONFLICT(quest_id) DO NOTHING', id, now);
        return claim.changes !== 0;
      },
    },
    events: {
      async has(id) { return Boolean(await db.getFirstAsync('SELECT id FROM verified_events WHERE id = ?', id)); },
      async append(event) { await db.runAsync('INSERT INTO verified_events (id, quest_id, payload, created_at) VALUES (?, ?, ?, ?)', event.id, event.questId, JSON.stringify(event), event.createdAt); },
    },
    idempotency: {
      async find(operation) {
        const player = await readPlayer();
        const canonical = completionOperation(player.id, operation.questId);
        if (operation.kind !== canonical.kind || operation.key !== canonical.key || operation.playerId !== player.id || operation.eventId !== canonical.eventId) throw new Error('Completion identity mismatch.');
        const row = await db.getFirstAsync<{ completed_at: string }>('SELECT completed_at FROM quest_completions WHERE quest_id = ?', operation.questId);
        return row ? { ...canonical, state: 'APPLIED', appliedAt: row.completed_at } : null;
      },
    },
    effects,
  };
}
