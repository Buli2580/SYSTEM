import { rewardReceipt } from '../core/rewards';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { LocationObject } from 'expo-location';
import { addRealXp, addSkillXp, type VerifiedEvent } from '../core';
import { isUsableLocation } from '../verification/gps';
import { locationToSector } from '../world/sectors';
import { generateSignal, signalReached, SIGNAL_ID, validSignal, type WorldSignal } from '../world/signals';
import { worldTransaction } from './database';

export type WorldSave = { sectorIds: string[]; signal: WorldSignal | null; signalError: boolean };
async function readSignal(db: SQLiteDatabase) {
  return db.getFirstAsync<WorldSignal>('SELECT id, latitude, longitude, status, revision FROM world_signals WHERE id = ?', SIGNAL_ID);
}
export function loadWorld(): Promise<WorldSave> {
  return worldTransaction(async db => {
    const rows = await db.getAllAsync<{ sector_id: string }>('SELECT sector_id FROM discovered_sectors');
    const signal = await readSignal(db);
    return { sectorIds: rows.map(row => row.sector_id), signal: signal && validSignal(signal) ? signal : null,
      signalError: Boolean(signal && !validSignal(signal)) };
  });
}
function requireFix(fix: LocationObject, active: () => boolean) {
  if (!active() || !isUsableLocation(fix)) throw new Error('Pomiar nie jest aktywny lub pozycja GPS jest nieaktualna.');
}
export function discoverSector(location: LocationObject, active: () => boolean = () => true) {
  const fix = { ...location, coords: { ...location.coords } };
  return worldTransaction(async db => {
    requireFix(fix, active);
    const sectorId = locationToSector(fix.coords);
    // Privacy: only the coarse sector and its first discovery time are stored.
    // Never persist GPS samples, an origin/home, or a route history.
    const result = await db.runAsync('INSERT INTO discovered_sectors (sector_id, first_discovered_at) VALUES (?, ?) ON CONFLICT(sector_id) DO NOTHING', sectorId, new Date().toISOString());
    return { sectorId, discovered: result.changes === 1 };
  });
}
export function scanSignal(location: LocationObject, relocate = false, expectedRevision?: number, active: () => boolean = () => true) {
  const fix = { ...location, coords: { ...location.coords } };
  return worldTransaction(async db => {
    requireFix(fix, active);
    const old = await readSignal(db);
    const reward = await db.getFirstAsync('SELECT id FROM verified_events WHERE id = ?', SIGNAL_ID);
    requireFix(fix, active);
    if (reward || old?.status === 'LOCATED') {
      if (!old || !validSignal(old)) throw new Error('Zapis sygnału jest uszkodzony. Nagroda pozostaje zabezpieczona.');
      return old;
    }
    if (old && validSignal(old) && (!relocate || old.revision !== expectedRevision)) return old;
    const revision = old && Number.isSafeInteger(old.revision) && old.revision >= 0 ? old.revision + 1 : 0;
    const signal = generateSignal(fix, revision);
    await db.runAsync(`INSERT INTO world_signals (id, latitude, longitude, status, revision, created_at)
      VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET latitude=excluded.latitude,
      longitude=excluded.longitude, revision=excluded.revision, status=excluded.status`,
    signal.id, signal.latitude, signal.longitude, signal.status, signal.revision, new Date().toISOString());
    return signal;
  });
}
export function locateSignal(location: LocationObject, revision: number, active: () => boolean = () => true) {
  const fix = { ...location, coords: { ...location.coords } };
  return worldTransaction(async (db, player) => {
    requireFix(fix, active);
    const signal = await readSignal(db);
    requireFix(fix, active);
    if (!signal || !validSignal(signal)) throw new Error('Nieprawidłowy zapis sygnału. Użyj RELOCATE SIGNAL.');
    if (signal.status === 'LOCATED' || signal.revision !== revision || !signalReached(fix, signal)) return { awarded: false, signal };
    const now = new Date().toISOString();
    const event: VerifiedEvent = {
      id: SIGNAL_ID, questId: SIGNAL_ID, playerId: player.id, createdAt: now,
      verificationType: 'GPS_LOCATION', verificationScore: 100, verified: true,
      realXpAwarded: 50, skillXpAwarded: { RES: 40 }, gameEnergyAwarded: 5,
      // No player coordinates in evidence: the game target is stored separately.
    };
    const claim = await db.runAsync('INSERT INTO verified_events (id, quest_id, payload, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING', SIGNAL_ID, SIGNAL_ID, JSON.stringify(event), now);
    let next = player;
    if (claim.changes === 1) {
      const rewarded = addSkillXp(addRealXp(player, 50), 'RES', 40);
      next = { ...rewarded, gameEnergy: rewarded.gameEnergy + 5, updatedAt: now };
      await db.runAsync('UPDATE app_state SET value = ? WHERE key = ?', JSON.stringify(next), 'player');
    }
    await db.runAsync('UPDATE world_signals SET status = ?, located_at = ? WHERE id = ?', 'LOCATED', now, SIGNAL_ID);
    return { awarded: claim.changes === 1, receipt: claim.changes === 1 ? rewardReceipt(SIGNAL_ID, player, next, ['SIGNAL HUNTER']) : undefined, signal: { ...signal, status: 'LOCATED' as const } };
  });
}
