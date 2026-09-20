const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { PGlite } = require('@electric-sql/pglite');

let db;
before(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;`);
  // gen_random_uuid is built into PostgreSQL; PGlite does not need pgcrypto.
  await db.exec(fs.readFileSync(path.join(__dirname, 'fixtures/cloud-baseline.sql'), 'utf8')
    .replace(/create extension if not exists pgcrypto;/i, ''));
  for (const file of fs.readdirSync(path.join(__dirname, '../migrations')).sort()) {
    let sql = fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8');
    if (process.env.DEBUG_PROCESSOR) sql = sql.replace('-- This exception block is a savepoint:', 'raise; -- This exception block is a savepoint:');
    await db.exec(sql);
  }
});
after(async () => { await db?.close(); });

async function user() {
  const id = randomUUID(); await db.query('INSERT INTO auth.users(id) VALUES ($1)', [id]); return id;
}
async function asUser(id, sql, params = []) {
  return db.transaction(async tx => {
    await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [id]);
    await tx.exec('SET LOCAL ROLE authenticated');
    return tx.query(sql, params);
  });
}
const movement = { quest_id: 'first_movement_v1', verification_type: 'GPS_DISTANCE', verification_score: 95, distance_meters: 503.25, duration_seconds: 400 };
const focus = { quest_id: 'focus_protocol_v1', verification_type: 'TIMER', verification_score: 100, duration_seconds: 600 };
async function submit(id, payload = movement, key = 'verified:first_movement_v1', type = 'VERIFIED_EVENT', entity = payload?.quest_id) {
  const result = await asUser(id, 'SELECT public.submit_sync_event($1,$2,$3,$4::jsonb) AS id', [key,type,entity ?? null,JSON.stringify(payload)]);
  return result.rows[0].id;
}
async function state(id) {
  return (await db.query('SELECT * FROM public.player_progress WHERE user_id=$1', [id])).rows[0];
}
async function event(id) {
  return (await db.query('SELECT * FROM public.sync_events WHERE id=$1', [id])).rows[0];
}
async function count(table, id) {
  return Number((await db.query(`SELECT count(*) n FROM public.${table} WHERE user_id=$1`, [id])).rows[0].n);
}

test('valid movement, duplicate and retry grant XP, skills, ledger and summary exactly once', async () => {
  const id=await user(); const key=await submit(id);
  assert.equal((await event(key)).processing_status,'PROCESSED');
  assert.equal(await submit(id),key);
  await asUser(id,'SELECT public.process_sync_event($1)',[key]);
  assert.equal(Number((await state(id)).real_total_xp),100);
  const skill=(await db.query("SELECT total_xp FROM public.skill_progress WHERE user_id=$1 AND skill_key='VIT'",[id])).rows[0];
  assert.equal(Number(skill.total_xp),80);
  for(const table of ['reward_claims','reward_ledger','verification_summaries']) assert.equal(await count(table,id),1);
  const status=(await asUser(id,'SELECT * FROM public.get_sync_status()')).rows[0];
  assert.equal(Number(status.processed),1);
});

test('server ignores client reward_code, XP and skill rewards', async () => {
  const id=await user();await submit(id,{...movement,reward_code:'BOSS_FIRST_WALL_COMPLETE',real_xp:999999,skill_rewards:{STR:999999},realXpAwarded:999999});
  assert.equal(Number((await state(id)).real_total_xp),100);
  assert.equal(Number((await db.query("SELECT total_xp FROM public.skill_progress WHERE user_id=$1 AND skill_key='STR'",[id])).rows[0].total_xp),0);
});

for (const [name, payload, reason] of [
  ['unknown quest',{...movement,quest_id:'invented'},'UNKNOWN_QUEST'],
  ['malformed payload',[], 'INVALID_PAYLOAD'],
  ['numeric string',{...movement,verification_score:'95'},'INVALID_PAYLOAD'],
  ['missing score',{...movement,verification_score:undefined},'INVALID_PAYLOAD'],
  ['impossible score',{...movement,verification_score:101},'INVALID_VERIFICATION'],
  ['wrong verification',{...movement,verification_type:'TIMER'},'INVALID_VERIFICATION'],
  ['insufficient distance',{...movement,distance_meters:499.99},'BELOW_DISTANCE'],
  ['insufficient duration',{...focus,duration_seconds:599},'BELOW_DURATION'],
  ['negative number',{...movement,distance_meters:-1},'INVALID_PAYLOAD'],
  ['huge distance',{...movement,distance_meters:1e20},'INVALID_PAYLOAD'],
  ['impossible speed',{...movement,distance_meters:10000,duration_seconds:1},'INVALID_VERIFICATION'],
]) test(name+' is rejected without rewards', async () => {
  const id=await user();const key=await submit(id,payload,'verified:invalid');
  assert.equal((await event(key)).processing_status,'REJECTED');
  assert.equal((await event(key)).rejection_reason,reason);
  assert.equal(Number((await state(id)).real_total_xp),0);assert.equal(await count('reward_ledger',id),0);
});

test('valid timer recalculates mobile level and rank and social projection', async () => {
  const id=await user();await submit(id);const key=await submit(id,focus,'verified:focus');
  assert.equal((await event(key)).processing_status,'PROCESSED');
  const player=await state(id);assert.equal(Number(player.real_total_xp),180);assert.equal(player.real_level,2);assert.equal(Number(player.real_xp),33);assert.equal(player.rank,'E');
  const social=(await db.query('SELECT real_level,real_total_xp FROM public.social_profiles WHERE user_id=$1',[id])).rows[0];
  assert.equal(social.real_level,2);assert.equal(Number(social.real_total_xp),180);
});

test('different event keys cannot reward the same one-time quest twice', async () => {
  const id=await user();await submit(id);const second=await submit(id,movement,'verified:another-install');
  assert.equal((await event(second)).rejection_reason,'DUPLICATE');
  assert.equal(Number((await state(id)).real_total_xp),100);
});

test('queued concurrent submissions preserve both events and deduplicate retries', async () => {
  const id=await user();await Promise.all([submit(id),submit(id),submit(id,focus,'verified:focus')]);
  assert.equal(Number((await state(id)).real_total_xp),180);assert.equal(await count('reward_ledger',id),2);
});

test('failure rolls back all reward writes and leaves a retryable event', async () => {
  const id=await user();
  await db.exec(`CREATE FUNCTION public.test_processor_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private failure details'; END $$;
    CREATE TRIGGER test_processor_fault BEFORE INSERT ON public.verification_summaries FOR EACH ROW EXECUTE FUNCTION public.test_processor_fault();`);
  let key;
  try {
    key=await submit(id);
    assert.equal((await event(key)).processing_status,'RECEIVED');assert.equal((await event(key)).rejection_reason,'PROCESSING_ERROR');
    assert.equal(Number((await state(id)).real_total_xp),0);
    for(const table of ['reward_claims','reward_ledger','verification_summaries','quest_completions']) assert.equal(await count(table,id),0);
  } finally {await db.exec('DROP TRIGGER test_processor_fault ON public.verification_summaries; DROP FUNCTION public.test_processor_fault();');}
  await submit(id);assert.equal((await event(key)).processing_status,'PROCESSED');assert.equal(Number((await state(id)).real_total_xp),100);
});

test('user A cannot process user B event or write authoritative tables', async () => {
  const a=await user(),b=await user(),key=await submit(b);
  await assert.rejects(asUser(a,'SELECT public.process_sync_event($1)',[key]),/UNAUTHORIZED/);
  for(const table of ['player_progress','skill_progress','reward_ledger','verification_summaries']) {
    await assert.rejects(asUser(a,`DELETE FROM public.${table} WHERE user_id=$1`,[a]),/permission denied/);
  }
  await assert.rejects(asUser(a,"UPDATE public.player_progress SET real_total_xp=999999 WHERE user_id=$1",[a]),/permission denied/);
  await assert.rejects(asUser(a,"INSERT INTO public.sync_events(user_id,event_key,entity_type) VALUES ($1,'forged','VERIFIED_EVENT')",[b]),/permission denied/);
  await assert.rejects(db.transaction(async tx=>{await tx.exec('SET LOCAL ROLE anon');return tx.query('SELECT public.process_sync_event($1)',[key]);}),/permission denied/);
});

const loadMobile = require('./mobile-loader.cjs')();
const { DAILY_TEMPLATES } = loadMobile('daily/templates');
const { DAILY_RULES } = loadMobile('daily/calendar');
const progression = loadMobile('core/progression');
async function awakening(id) {
  for (const payload of [movement,focus,
    {quest_id:'final_trial_v1',verification_type:'MULTI',verification_score:95,distance_meters:603,duration_seconds:600},
    {quest_id:'awakening_chapter_1',verification_type:'MULTI',verification_score:100}]) {
    const key=await submit(id,payload,'verified:'+payload.quest_id);
    assert.equal((await event(key)).processing_status,'PROCESSED');
  }
}
function daily(template, day='2026-09-18') {
  return {quest_id:`daily:${day}:${template.id}`,verification_type:template.verification.type,
    verification_score:100,distance_meters:template.verification.minimumDistanceMeters ?? 0,
    duration_seconds:template.verification.minimumDurationSeconds ?? 1200,
    ...(template.activityType ? {activity:{expected:template.activityType,detected:template.activityType,verdict:'VERIFIED'}} : {})};
}
for(const template of DAILY_TEMPLATES) test('server reward and evidence match mobile daily '+template.id,async()=>{
  const id=await user();await awakening(id);
  const payload=daily(template),key=await submit(id,payload,'verified:daily');
  assert.equal((await event(key)).processing_status,'PROCESSED');
  const ledger=(await db.query('SELECT * FROM public.reward_ledger WHERE user_id=$1 AND evidence_event_key=$2',[id,'verified:daily'])).rows[0];
  assert.equal(ledger.real_xp,template.rewards.realXp);assert.equal(ledger.energy,template.rewards.gameEnergy);
  assert.equal(JSON.stringify(ledger.skill_rewards),JSON.stringify(template.rewards.skillXp));
  assert.equal(Number((await state(id)).real_total_xp),600+template.rewards.realXp);
  const duplicate=await submit(id,payload,'verified:daily-other');assert.equal((await event(duplicate)).rejection_reason,'DUPLICATE');
});

test('daily slots, movement slots and derived bonuses match mobile budgets',async()=>{
  const id=await user();await awakening(id);
  const timers=DAILY_TEMPLATES.filter(t=>!t.activityType),moves=DAILY_TEMPLATES.filter(t=>t.activityType);
  const bonus={quest_id:'daily_clear:2026-09-18',verification_type:'MULTI',verification_score:100};
  const bonusKey=await submit(id,bonus,'verified:clear');
  assert.equal((await event(bonusKey)).rejection_reason,'MISSING_PREREQUISITE');
  for(const t of [moves[0],...timers.slice(0,2)]) await submit(id,daily(t),'verified:'+t.id);
  const fourth=await submit(id,daily(timers[2]),'verified:fourth');assert.equal((await event(fourth)).rejection_reason,'DAILY_LIMIT');
  await asUser(id,'SELECT public.process_pending_sync_events()');
  assert.equal((await event(bonusKey)).processing_status,'PROCESSED');
  const ledger=(await db.query("SELECT real_xp,energy FROM public.reward_ledger WHERE user_id=$1 AND reward_code='DAILY_CLEAR'",[id])).rows[0];
  assert.equal(ledger.real_xp,DAILY_RULES.clearXp);assert.equal(ledger.energy,DAILY_RULES.clearEnergy);
  await submit(id,daily(moves[0],'2026-09-19'),'verified:next-move');
  const extra=await submit(id,daily(moves[1],'2026-09-19'),'verified:extra-move');assert.equal((await event(extra)).rejection_reason,'DAILY_LIMIT');
  await submit(id,daily(timers[0],'2026-09-19'),'verified:next-timer');
  const weekly=await submit(id,{...bonus,quest_id:'weekly_complete:2026-W38'},'verified:weekly');
  assert.equal((await event(weekly)).processing_status,'PROCESSED');
  assert.equal((await db.query("SELECT real_xp FROM public.reward_ledger WHERE user_id=$1 AND reward_code='WEEKLY_COMPLETE'",[id])).rows[0].real_xp,DAILY_RULES.weeklyXp);
});

test('all mobile rank boundaries and skill thresholds agree with SQL progression',async()=>{
  for(const skill of [false,true]) {
    const needed=skill?progression.xpNeededForSkillLevel:progression.xpNeededForRealLevel;
    let total=0;
    for(let level=1;level<=301;level++) {
      if([1,2,9,10,24,25,44,45,69,70,99,100,149,150,199,200,299,300,301].includes(level)) {
        for(const extra of [0,needed(level)-1]) {
          const row=(await db.query('SELECT p.*,private.sync_rank(p.level) rank FROM private.sync_progress($1,$2) p',[total+extra,skill])).rows[0];
          assert.equal(row.level,level);assert.equal(Number(row.xp),extra);assert.equal(row.rank,progression.rankForLevel(level));
        }
      }
      total+=needed(level);
    }
  }
});

test('real rank promotion and skill level promotion update social projection once',async()=>{
  const id=await user();let total=0;for(let l=1;l<10;l++)total+=progression.xpNeededForRealLevel(l);
  await db.query('UPDATE public.player_progress SET real_total_xp=$2 WHERE user_id=$1',[id,total-100]);
  await db.query("UPDATE public.skill_progress SET total_xp=100 WHERE user_id=$1 AND skill_key='VIT'",[id]);
  await submit(id);await submit(id);
  const p=await state(id);assert.equal(p.real_level,10);assert.equal(p.rank,'D');assert.equal(p.evolution_stage,1);
  const skill=(await db.query("SELECT * FROM public.skill_progress WHERE user_id=$1 AND skill_key='VIT'",[id])).rows[0];
  assert.equal(skill.level,2);assert.equal(Number(skill.xp),63);assert.equal(Number(skill.total_xp),180);
  assert.equal((await db.query('SELECT rank FROM public.social_profiles WHERE user_id=$1',[id])).rows[0].rank,'D');
});

test('out-of-order delivery and legacy RECEIVED backlog are retryable without starvation',async()=>{
  const id=await user();
  const waiting=await submit(id,{quest_id:'world_link_chapter_2',verification_type:'MULTI',verification_score:100},'verified:waiting');
  const pending=await submit(id,focus,'verified:focus');
  await db.query(`INSERT INTO public.sync_events(user_id,event_key,entity_type,entity_id,payload)
    VALUES($1,'verified:legacy','VERIFIED_EVENT','first_movement_v1',$2)`,[id,JSON.stringify(movement)]);
  for(let n=0;n<4;n++)await asUser(id,'SELECT public.process_pending_sync_events(1)');
  assert.equal((await event(waiting)).processing_status,'RECEIVED');
  assert.equal((await event(pending)).processing_status,'PROCESSED');
  assert.equal(Number((await state(id)).real_total_xp),180);
});

test('owner spoof, unknown entity and suspicious activity are rejected',async()=>{
  const id=await user();
  const spoof=await submit(id,{...movement,user_id:randomUUID()},'verified:spoof');
  assert.equal((await event(spoof)).rejection_reason,'INVALID_PAYLOAD');
  const type=await submit(id,movement,'verified:type','REWARD');
  assert.equal((await event(type)).rejection_reason,'UNSUPPORTED_EVENT');
  const payload=daily(DAILY_TEMPLATES[0]);payload.activity.verdict='SUSPICIOUS';
  const suspect=await submit(id,payload,'verified:suspect');
  assert.equal((await event(suspect)).rejection_reason,'INVALID_VERIFICATION');
  assert.equal(await count('reward_ledger',id),0);
});

test('server time bounds daily dates, payload privacy and event keys are enforced',async()=>{
  const id=await user();
  for(const day of ['2099-12-31','2026-02-30','2025-01-01']) {
    const key=await submit(id,daily(DAILY_TEMPLATES[0],day),'verified:'+day);
    assert.equal((await event(key)).rejection_reason,'INVALID_PAYLOAD');
  }
  await assert.rejects(submit(id,{...movement,route:[{latitude:1,longitude:1}]}),/SENSITIVE_FIELD_REJECTED/);
  await assert.rejects(submit(id,movement,'bad key'),/INVALID_EVENT_KEY/);
  const key=await submit(id,{...movement,arbitrary:[1,2],reward_code:'FAKE',activity:{features:{samples:[1,2]}}});
  const payload=(await event(key)).payload;
  assert.equal(payload.arbitrary,undefined);assert.equal(payload.reward_code,undefined);assert.equal(payload.activity.features,undefined);
});

test('two different users process independently and cannot read each other events',async()=>{
  const a=await user(),b=await user();await Promise.all([submit(a),submit(b)]);
  assert.equal(Number((await state(a)).real_total_xp),100);assert.equal(Number((await state(b)).real_total_xp),100);
  assert.equal((await asUser(a,'SELECT * FROM public.sync_events WHERE user_id=$1',[b])).rows.length,0);
  await assert.rejects(asUser(a,'SELECT private.sync_progress(999)'),/permission denied/);
  await assert.rejects(asUser(null,'SELECT public.process_pending_sync_events()'),/UNAUTHORIZED/);
});

test('legacy pending claim cannot dictate rewards or block a valid event',async()=>{
  const id=await user();
  await db.query(`INSERT INTO public.reward_claims(user_id,claim_key,reward_code,source_type,status)
    VALUES($1,'sync-quest:first_movement_v1','BOSS_FIRST_WALL_COMPLETE','client','PENDING')`,[id]);
  const key=await submit(id);assert.equal((await event(key)).processing_status,'PROCESSED');
  const claim=(await db.query('SELECT * FROM public.reward_claims WHERE user_id=$1',[id])).rows[0];
  assert.equal(claim.reward_code,'AWAKENING_FIRST_MOVE');assert.equal(claim.status,'APPROVED');
  assert.equal(Number((await state(id)).real_total_xp),100);
});

test('preexisting reward under an older ledger key is never granted again',async()=>{
  const id=await user();
  await db.query(`INSERT INTO public.reward_ledger(user_id,ledger_key,reward_code,real_xp,source_type,source_id)
    VALUES($1,'old-key','AWAKENING_FIRST_MOVE',100,'quest','first_movement_v1')`,[id]);
  await db.query('UPDATE public.player_progress SET real_total_xp=100,real_xp=100 WHERE user_id=$1',[id]);
  const key=await submit(id);assert.equal((await event(key)).rejection_reason,'DUPLICATE');
  assert.equal(Number((await state(id)).real_total_xp),100);assert.equal(await count('reward_ledger',id),1);
});

test('derived story awards need server evidence and cannot trust completion claims',async()=>{
  const id=await user();await awakening(id);
  const story=quest_id=>({quest_id,verification_type:'MULTI',verification_score:100});
  const extra=await submit(id,story('extra_mile_v1'),'verified:extra');
  assert.equal((await event(extra)).processing_status,'RECEIVED');
  const movement=daily(DAILY_TEMPLATES[0]);movement.distance_meters*=1.25;
  await submit(id,movement,'verified:long-walk');await asUser(id,'SELECT public.process_pending_sync_events()');
  assert.equal((await event(extra)).processing_status,'PROCESSED');
  const hidden=await submit(id,story('no_turning_back_v1'),'verified:hidden');
  const rematch=await submit(id,story('rematch:first_movement_v1'),'verified:rematch');
  assert.equal((await event(hidden)).rejection_reason,'UNSUPPORTED_EVENT');
  assert.equal((await event(rematch)).rejection_reason,'UNSUPPORTED_EVENT');
  const signal=await submit(id,{...story('first_world_signal_v1'),verification_type:'GPS_LOCATION'},'verified:signal');
  assert.equal((await event(signal)).processing_status,'RECEIVED');
  // Only trusted backend world data can satisfy location eligibility. There is
  // deliberately no client-owned write to these tables in this processor.
  await db.query("INSERT INTO public.world_signals(user_id,signal_id,status) VALUES($1,'first_world_signal_v1','LOCATED')",[id]);
  await asUser(id,'SELECT public.process_sync_event($1)',[signal]);
  assert.equal((await event(signal)).processing_status,'PROCESSED');
});

test('invalid derived period identifiers are terminal payload failures',async()=>{
  const id=await user();
  for(const quest_id of ['daily_clear:2026-99-99','daily_clear:2099-01-01','weekly_complete:2026-W99','weekly_complete:2099-W01']) {
    const key=await submit(id,{quest_id,verification_type:'MULTI',verification_score:100},'verified:'+quest_id);
    assert.equal((await event(key)).rejection_reason,'INVALID_PAYLOAD');
  }
});

test('awakening accepts mobile GPS speed ceiling of 8.5 metres per second',async()=>{
  const id=await user();
  const key=await submit(id,{...movement,distance_meters:510,duration_seconds:60});
  assert.equal((await event(key)).processing_status,'PROCESSED');
});
