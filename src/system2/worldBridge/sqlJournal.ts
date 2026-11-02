import type {SQLiteDatabase} from 'expo-sqlite';
import type {JournalRecord,WorldCommandJournal} from './host';

type JournalDatabase=Pick<SQLiteDatabase,'execAsync'|'withExclusiveTransactionAsync'>;
export const WORLD_JOURNAL_DATABASE='system-world-bridge-v1.db';

/** Explicit opt-in. Never opens or migrates SYSTEM gameplay SQLite; no automatic pruning of uncertain effects. */
export async function openWorldCommandJournal(open:(name:string)=>Promise<JournalDatabase>):Promise<WorldCommandJournal> {
  const db=await open(WORLD_JOURNAL_DATABASE);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS world_command_journal (
    command_key TEXT PRIMARY KEY NOT NULL,
    fingerprint TEXT NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('PENDING','APPLIED'))
  )`);
  return {
    async claim(key,fingerprint){
      let answer:{claimed:boolean;record:JournalRecord}|undefined;
      await db.withExclusiveTransactionAsync(async tx=>{
        const inserted=await tx.runAsync("INSERT OR IGNORE INTO world_command_journal(command_key,fingerprint,state) VALUES (?,?,'PENDING')",key,fingerprint);
        const record=await tx.getFirstAsync<JournalRecord>('SELECT fingerprint,state FROM world_command_journal WHERE command_key=?',key);
        if(!record||!['PENDING','APPLIED'].includes(record.state))throw new Error('JOURNAL_CORRUPT');
        answer={claimed:inserted.changes===1,record};
      });
      if(!answer)throw new Error('JOURNAL_CLAIM');
      return answer;
    },
    async complete(key,fingerprint){
      await db.withExclusiveTransactionAsync(async tx=>{
        const written=await tx.runAsync("UPDATE world_command_journal SET state='APPLIED' WHERE command_key=? AND fingerprint=? AND state='PENDING'",key,fingerprint);
        if(written.changes!==1)throw new Error('JOURNAL_CONFLICT');
      });
    },
  };
}
