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
async function submit(id, payload = movement, key = 'verified:first_movement_v1', type = 'VERIFIED_EVENT', entity = payload?.quest_id, clientCreatedAt = null) {
  const result = await asUser(
    id,
    'SELECT public.submit_sync_event($1,$2,$3,$4::jsonb,$5,$6::timestamptz,$7) AS id',
    [key,type,entity ?? null,JSON.stringify(payload),null,clientCreatedAt,1],
  );
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
  // Keep synthetic prerequisite evidence in the same fixture week as generated Daily
  // evidence. This avoids test behavior changing when CI crosses an ISO-week boundary.
  const clientCreatedAt = '2026-09-18T12:00:00Z';
  for (const payload of [movement,focus,
    {quest_id:'final_trial_v1',verification_type:'MULTI',verification_score:95,distance_meters:603,duration_seconds:600},
    {quest_id:'awakening_chapter_1',verification_type:'MULTI',verification_score:100}]) {
    const key=await submit(id,payload,'verified:'+payload.quest_id,'VERIFIED_EVENT',payload.quest_id,clientCreatedAt);
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

const generated = loadMobile('generation/templates');
function generatedEvidence(template,tier='easy',day='2026-09-18') {
 const q=generated.generatedQuest('daily:'+day+':g1_'+template+'_'+tier);
 return {quest_id:q.id,verification_type:q.verification.type,verification_score:100,
 distance_meters:q.verification.minimumDistanceMeters??0,duration_seconds:q.verification.minimumDurationSeconds??1200,
 ...(q.activityType?{activity:{expected:q.activityType,detected:q.activityType,verdict:'VERIFIED'}}:{})};
}
function progressionClaim(suffix,local='local_player_A') {return {quest_id:'progression:'+local+':'+suffix,verification_type:'MULTI',verification_score:100,real_xp:999999};}

test('all105 generated rules match immutable mobile targets and server-owned rewards',async()=>{
 for(const template of generated.QUEST_TEMPLATES) for(const tier of ['easy','normal','hard']) {
  const q=generated.generatedQuest('daily:2026-09-18:g1_'+template.id+'_'+tier);
  const row=(await db.query('SELECT r.*,c.real_xp,c.energy,c.skill_rewards FROM private.sync_quest_rules r JOIN public.reward_catalog c USING(reward_code) WHERE r.rule_key=$1',['daily:'+q.templateId])).rows[0];
  assert.ok(row,q.id);assert.equal(row.real_xp,q.rewards.realXp);assert.equal(row.energy,q.rewards.gameEnergy);
  assert.deepEqual(row.skill_rewards,{...q.rewards.skillXp});assert.equal(row.verification_type,q.verification.type);
  assert.equal(Number(row.minimum_distance),q.verification.minimumDistanceMeters??0);
  assert.equal(Number(row.minimum_duration),q.verification.minimumDurationSeconds??1);
  assert.equal(row.minimum_level,generated.DIFFICULTY[tier.toUpperCase()].minLevel);
 }
});
for(const tier of ['easy','normal','hard']) test('generated '+tier+' rewards commit once and reject replay',async()=>{
 const id=await user();await awakening(id);let xp=0;for(let l=1;l<8;l++)xp+=progression.xpNeededForRealLevel(l);
 await db.query('UPDATE public.player_progress SET real_level=8,real_total_xp=$2 WHERE user_id=$1',[id,xp]);
 const payload=generatedEvidence('learn_read',tier),key=await submit(id,{...payload,real_xp:999999},'generated:'+tier);
 assert.equal((await event(key)).processing_status,'PROCESSED');
 assert.equal(Number((await state(id)).real_total_xp),xp+generated.DIFFICULTY[tier.toUpperCase()].xp);
 const again=await submit(id,payload,'replay:'+tier);assert.equal((await event(again)).rejection_reason,'DUPLICATE');
});
test('generated movement loadout accepts3 verified movements and rejects fourth slot',async()=>{
 const id=await user();await awakening(id);
 for(const name of ['walk_fresh','run_easy','ride_easy']){const key=await submit(id,generatedEvidence(name),'loadout:'+name);assert.equal((await event(key)).processing_status,'PROCESSED');}
 const fourth=await submit(id,generatedEvidence('learn_read'),'loadout:fourth');assert.equal((await event(fourth)).rejection_reason,'DAILY_LIMIT');
 const unknown=await submit(id,{...generatedEvidence('learn_read'),quest_id:'daily:2026-09-18:g2_learn_read_easy'},'unknown:g2');assert.equal((await event(unknown)).rejection_reason,'UNKNOWN_QUEST');
});
test('generated difficulty waits for server progression and pending retry grants once',async()=>{
 const id=await user();await awakening(id);const key=await submit(id,generatedEvidence('learn_read','hard'),'difficulty:hard');
 assert.equal((await event(key)).processing_status,'RECEIVED');
 let xp=0;for(let l=1;l<8;l++)xp+=progression.xpNeededForRealLevel(l);
 await db.query('UPDATE public.player_progress SET real_level=8,real_total_xp=$2 WHERE user_id=$1',[id,xp]);
 await asUser(id,'SELECT public.process_pending_sync_events()');await asUser(id,'SELECT public.process_pending_sync_events()');
 assert.equal((await event(key)).processing_status,'PROCESSED');assert.equal(Number((await state(id)).real_total_xp),xp+75);
});
test('weekly progression uses direct evidence and normalizes local profile replay',async()=>{
 const id=await user();await awakening(id);
 const claim=progressionClaim('weekly:2026-W38:weekly_quest_master');const key=await submit(id,claim,'progression:early');
 assert.equal((await event(key)).processing_status,'RECEIVED','Awakening derived claim must not count as4th quest');
 await submit(id,generatedEvidence('learn_read'),'weekly:one');await asUser(id,'SELECT public.process_pending_sync_events()');assert.equal((await event(key)).processing_status,'RECEIVED');
 await submit(id,generatedEvidence('focus_begin'),'weekly:two');await asUser(id,'SELECT public.process_pending_sync_events()');
 assert.equal((await event(key)).processing_status,'PROCESSED');assert.equal(Number((await state(id)).real_total_xp),600+60+200);
 const replay=await submit(id,progressionClaim('weekly:2026-W38:weekly_quest_master','another_install'),'progression:replay');assert.equal((await event(replay)).rejection_reason,'DUPLICATE');
 const outsider=await user();const stolen=await submit(outsider,claim,'progression:stolen');assert.equal((await event(stolen)).processing_status,'RECEIVED');assert.equal(await count('reward_ledger',outsider),0);
});
test('weekly distinct-day and verified-distance rewards are independently derived',async()=>{
 const id=await user();await awakening(id);
 for(const day of ['2026-09-18','2026-09-19','2026-09-20']) {
  const p=generatedEvidence('ride_easy','easy',day);p.distance_meters=3500;await submit(id,p,'distance:'+day);
 }
 for(const [kind,xp,en] of [['weekly_daily_consistency',150,15],['weekly_pathfinder',180,18]]){
  const key=await submit(id,progressionClaim('weekly:2026-W38:'+kind),'progression:'+kind);assert.equal((await event(key)).processing_status,'PROCESSED');
  const row=(await db.query('SELECT real_xp,energy FROM public.reward_ledger WHERE user_id=$1 AND evidence_event_key=$2',[id,'progression:'+kind])).rows[0];assert.equal(row.real_xp,xp);assert.equal(row.energy,en);
 }
});
async function legacyClears(id,days=30,gap=-1){
 // Trusted existing ledger fixture: legacy accepted clears survive the forward migration.
 for(let n=0;n<days;n++){if(n===gap)continue;const day=new Date(Date.UTC(2026,7,22+n)).toISOString().slice(0,10);
 await db.query("INSERT INTO public.reward_ledger(user_id,ledger_key,reward_code,real_xp,energy,source_type,source_id) VALUES($1,$2,'DAILY_CLEAR',75,10,'VERIFIED_EVENT',$3)",[id,'legacy-clear:'+day,'daily_clear:'+day]);}
}
test('legacy qualified clears support all milestone rewards and weekly streak exactly once',async()=>{
 const id=await user();await legacyClears(id);
 for(const [days,xp,en] of [[3,50,5],[7,76,8],[14,108,11],[30,158,16]]){
  const key=await submit(id,progressionClaim('milestone:'+days),'milestone:'+days);assert.equal((await event(key)).processing_status,'PROCESSED');
  const row=(await db.query('SELECT real_xp,energy FROM public.reward_ledger WHERE user_id=$1 AND evidence_event_key=$2',[id,'milestone:'+days])).rows[0];assert.equal(row.real_xp,xp);assert.equal(row.energy,en);
  const replay=await submit(id,progressionClaim('milestone:'+days,'other-profile'),'milestone-replay:'+days);assert.equal((await event(replay)).rejection_reason,'DUPLICATE');
 }
 const weekly=await submit(id,progressionClaim('weekly:2026-W38:weekly_streak_keeper'),'weekly:streak');assert.equal((await event(weekly)).processing_status,'PROCESSED');assert.equal(Number((await state(id)).real_total_xp),392+250);
 const broken=await user();await legacyClears(broken,30,15);const no30=await submit(broken,progressionClaim('milestone:30'),'milestone:gap');assert.equal((await event(no30)).processing_status,'RECEIVED');
});
test('transient progression failure rolls back normalized claim and retry grants exactly once',async()=>{
 const id=await user();await legacyClears(id,3);
 await db.exec("CREATE FUNCTION public.test_bonus_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'transient'; END $$; CREATE TRIGGER test_bonus_fault BEFORE INSERT ON public.verification_summaries FOR EACH ROW EXECUTE FUNCTION public.test_bonus_fault();");
 let key;try{key=await submit(id,progressionClaim('milestone:3'),'bonus:retry');assert.equal((await event(key)).processing_status,'RECEIVED');assert.equal(Number((await state(id)).real_total_xp),0);assert.equal(await count('reward_claims',id),0);}finally{await db.exec('DROP TRIGGER test_bonus_fault ON public.verification_summaries; DROP FUNCTION public.test_bonus_fault();');}
 await asUser(id,'SELECT public.process_pending_sync_events()');await asUser(id,'SELECT public.process_sync_event($1)',[key]);assert.equal(Number((await state(id)).real_total_xp),50);assert.equal(await count('reward_claims',id),1);
});
test('boss story claim requires server boss completion and pays fixed reward once',async()=>{
 const id=await user();await awakening(id);
 await db.query("INSERT INTO public.reward_ledger(user_id,ledger_key,reward_code,source_type,source_id) VALUES($1,'trusted-world','WORLD_LINK_COMPLETE','VERIFIED_EVENT','world_link_chapter_2')",[id]);
 await submit(id,{quest_id:'wall_focus_v1',verification_type:'TIMER',verification_score:100,duration_seconds:900},'boss:focus');
 const payload={quest_id:'the_first_wall_v1',verification_type:'MULTI',verification_score:100,boss_complete:true,real_xp:99999};const key=await submit(id,payload,'boss:claim');assert.equal((await event(key)).processing_status,'RECEIVED');
 await assert.rejects(asUser(id,"INSERT INTO public.boss_progress(user_id,boss_id,status) VALUES($1,'the_first_wall_v1','COMPLETED')",[id]),/permission denied/);
 await db.query("INSERT INTO public.boss_progress(user_id,boss_id,status) VALUES($1,'the_first_wall_v1','COMPLETED')",[id]);
 await asUser(id,'SELECT public.process_pending_sync_events()');assert.equal((await event(key)).processing_status,'PROCESSED');assert.equal(Number((await state(id)).real_total_xp),1100);
 const replay=await submit(id,payload,'boss:replay');assert.equal((await event(replay)).rejection_reason,'DUPLICATE');
});

test('timer distance and derived reward metadata cannot fund Pathfinder',async()=>{
 const id=await user();await awakening(id);const timer=generatedEvidence('learn_read');timer.distance_meters=100000;
 assert.equal((await event(await submit(id,timer,'timer:fake-distance'))).processing_status,'PROCESSED');
 const claim=await submit(id,progressionClaim('weekly:2026-W38:weekly_pathfinder'),'pathfinder:fake');
 assert.equal((await event(claim)).processing_status,'RECEIVED');
 assert.equal((await db.query("SELECT count(*) n FROM public.reward_ledger WHERE user_id=$1 AND reward_code='PROGRESSION_WEEKLY_PATHFINDER'",[id])).rows[0].n,0);
});
test('fractional verified GPS evidence is retained for weekly distance thresholds',async()=>{
 const id=await user();await awakening(id);
 for(const [n,day] of ['2026-09-18','2026-09-19','2026-09-20'].entries()){
  const p=generatedEvidence('ride_easy','easy',day);p.distance_meters=3333.4;await submit(id,p,'fractional:'+n);
 }
 const key=await submit(id,progressionClaim('weekly:2026-W38:weekly_pathfinder'),'fractional:claim');assert.equal((await event(key)).processing_status,'PROCESSED');
});
test('forward migration preserves settled rewards and requeues newly recognized legacy rejections',async()=>{
 const upgrade=new PGlite();try{
 await upgrade.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,raw_user_meta_data jsonb DEFAULT '{}'); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role; GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;");
 await upgrade.exec(fs.readFileSync(path.join(__dirname,'fixtures/cloud-baseline.sql'),'utf8').replace(/create extension if not exists pgcrypto;/i,''));
 const files=fs.readdirSync(path.join(__dirname,'../migrations')).sort();const compatibility=files.find(f=>f.endsWith('_canonical_processor_compatibility.sql'));
 for(const file of files){if(file===compatibility)break;await upgrade.exec(fs.readFileSync(path.join(__dirname,'../migrations',file),'utf8'));}
 const id=randomUUID();await upgrade.query('INSERT INTO auth.users(id) VALUES($1)',[id]);
 const call=async(p,key)=>upgrade.transaction(async tx=>{await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[id]);await tx.exec('SET LOCAL ROLE authenticated');return (await tx.query("SELECT public.submit_sync_event($1,'VERIFIED_EVENT',$2,$3::jsonb) id",[key,p.quest_id,JSON.stringify(p)])).rows[0].id;});
 for(const p of [movement,focus,{quest_id:'final_trial_v1',verification_type:'MULTI',verification_score:95,distance_meters:603,duration_seconds:600},{quest_id:'awakening_chapter_1',verification_type:'MULTI',verification_score:100}])await call(p,'upgrade:'+p.quest_id);
 const pending=await call(generatedEvidence('learn_read'),'upgrade:generated');
 assert.equal((await upgrade.query('SELECT rejection_reason FROM public.sync_events WHERE id=$1',[pending])).rows[0].rejection_reason,'UNKNOWN_QUEST');
 const prior=(await upgrade.query('SELECT count(*) n FROM public.reward_ledger WHERE user_id=$1',[id])).rows[0].n;
 await upgrade.exec(fs.readFileSync(path.join(__dirname,'../migrations',compatibility),'utf8'));
 assert.equal((await upgrade.query('SELECT count(*) n FROM public.reward_ledger WHERE user_id=$1',[id])).rows[0].n,prior);
 assert.equal((await upgrade.query('SELECT processing_status FROM public.sync_events WHERE id=$1',[pending])).rows[0].processing_status,'RECEIVED');
 await call(generatedEvidence('learn_read'),'upgrade:generated');await call(generatedEvidence('learn_read'),'upgrade:generated');
 assert.equal(Number((await upgrade.query('SELECT real_total_xp FROM public.player_progress WHERE user_id=$1',[id])).rows[0].real_total_xp),630);
 }finally{await upgrade.close();}
});

test('local Monday attribution survives Sunday UTC upload and forged days are rejected',async()=>{
 const id=await user();
 const send=async(p,key)=> (await asUser(id,"SELECT public.submit_sync_event($1,'VERIFIED_EVENT',$2,$3::jsonb,null,$4::timestamptz) id",[key,p.quest_id,JSON.stringify({...p,completed_day:'2026-09-21'}),'2026-09-20T22:30:00Z'])).rows[0].id;
 for(const p of [movement,focus,{quest_id:'final_trial_v1',verification_type:'MULTI',verification_score:95,distance_meters:603,duration_seconds:600},{quest_id:'awakening_chapter_1',verification_type:'MULTI',verification_score:100}]){const key=await send(p,'monday:'+p.quest_id);assert.equal((await event(key)).processing_status,'PROCESSED');}
 for(const name of ['learn_read','focus_begin'])await send(generatedEvidence(name,'easy','2026-09-21'),'monday:'+name);
 const bonus=await submit(id,progressionClaim('weekly:2026-W39:weekly_quest_master'),'monday:bonus');assert.equal((await event(bonus)).processing_status,'PROCESSED');
 const other=await user();const invalid=await submit(other,{...movement,completed_day:'2099-12-31'},'forged:day');assert.equal((await event(invalid)).rejection_reason,'INVALID_PAYLOAD');
});


// Ranked MOVE requires separately PROCESSED core evidence. Merely posting
// local timer/GPS metadata must not alter official group totals.
test('MOVE legacy self-reported claims cannot inflate official rankings',async()=>{
 const owner=await user();
 const group=(await asUser(owner,"select public.create_move_group('FAMILY','MVP secure group') as id")).rows[0].id;
 await assert.rejects(asUser(owner,
   "select public.submit_move_contribution($1,'move:fake','move_walk_10','GPS',100,current_date)",
   [group]),/permission denied|MOVE_SERVER_EVIDENCE_REQUIRED/i);
 // Preserve an old entry for audit, but quarantine it from official totals.
 await db.query("insert into public.move_contributions(group_id,user_id,event_key,quest_id,verified_minutes,verification_method,verification_score,day_key) values($1,$2,'move:untrusted-old','move_bike_20',20,'GPS',100,current_date)",[group,owner]);
 const groups=await asUser(owner,'select * from public.get_my_move_groups()');
 assert.equal(Number(groups.rows[0].total_minutes),0);
 const board=await asUser(owner,'select * from public.get_move_group_leaderboard($1)',[group]);
 assert.equal(board.rows.length,0);
});

test('MOVE trusted source cannot be forged, double-claimed, reassigned, or seen across groups',async()=>{
 const owner=await user(),outsider=await user();
 const group=(await asUser(owner,"select public.create_move_group('FAMILY','Verified group') as id")).rows[0].id;
 const today=(await db.query('select current_date::text as day')).rows[0].day;
 const key='verified:move-ranked-'+randomUUID().replaceAll('-','');
 const coreQuest='daily:'+today+':walk_protocol_1';
 await assert.rejects(asUser(owner,
   'select public.submit_verified_move_contribution($1,$2,$3,$4::date)',
   [group,key,'move_walk_10',today]),/MOVE_SERVER_EVIDENCE_REQUIRED/);
 await db.query(`insert into public.sync_events(user_id,event_key,entity_type,entity_id,payload,processing_status,schema_version)
   values($1,$2,'VERIFIED_EVENT',$3,'{}'::jsonb,'PROCESSED',1)`,[owner,key,coreQuest]);
 await db.query(`insert into public.verification_summaries(user_id,event_key,activity_type,verdict,confidence_score,distance_meters,duration_seconds)
   values($1,$2,'WALK','VERIFIED',85,1600,750)`,[owner,key]);
 // An outsider cannot submit another member's trusted proof.
 await assert.rejects(asUser(outsider,
   'select public.submit_verified_move_contribution($1,$2,$3,$4::date)',
   [group,key,'move_walk_10',today]),/NOT_GROUP_MEMBER/);
 await assert.rejects(asUser(owner,
   'select public.submit_verified_move_contribution($1,$2,$3,$4::date)',
   [group,key,'move_bike_20',today]),/MOVE_SERVER_EVIDENCE_REQUIRED/);
 await assert.rejects(asUser(owner,
   'select public.submit_verified_move_contribution($1,$2,$3,$4::date)',
   [group,key,'move_walk_10','2026-09-18']),/MOVE_SERVER_EVIDENCE_REQUIRED|INVALID_MOVE_DAY/);
 const accepted=await asUser(owner,
   'select public.submit_verified_move_contribution($1,$2,$3,$4::date) as minutes',
   [group,key,'move_walk_10',today]);
 assert.equal(accepted.rows[0].minutes,10);
 const repeated=await asUser(owner,
   'select public.submit_verified_move_contribution($1,$2,$3,$4::date) as minutes',
   [group,key,'move_walk_10',today]);
 assert.equal(repeated.rows[0].minutes,0);
 const groupStatus=await asUser(owner,'select * from public.get_my_move_groups()');
 assert.equal(Number(groupStatus.rows[0].total_minutes),10);
 const board=await asUser(owner,'select * from public.get_move_group_leaderboard($1)',[group]);
 assert.equal(board.rows.length,1);assert.equal(Number(board.rows[0].verified_minutes),10);
 const source=await asUser(owner,'select * from public.get_my_move_verified_source($1,$2::date)',['move_walk_10',today]);
 assert.equal(source.rows[0].event_key,key);
 const invisible=await asUser(outsider,'select * from public.get_my_move_verified_source($1,$2::date)',['move_walk_10',today]);
 assert.equal(invisible.rows.length,0);
});

test('MOVE invited family member can see group totals but not individual rankings',async()=>{
 const parent=await user(),member=await user();
 const group=(await asUser(parent,"select public.create_move_group('FAMILY','Privacy group') as id")).rows[0].id;
 const code=(await asUser(parent,"select public.create_move_group_invite($1,'MEMBER',1,24) as code",[group])).rows[0].code;
 await asUser(member,'select public.join_move_group($1)',[code]);
 const groups=await asUser(member,'select * from public.get_my_move_groups()');
 assert.equal(groups.rows[0].name,'Privacy group');
 const board=await asUser(member,'select * from public.get_move_group_leaderboard($1)',[group]);
 assert.equal(board.rows.length,0);
});

test('concurrent two-install claim replay preserves exactly-once core XP',async()=>{
 const id=await user();
 const attempts=[
  ...Array.from({length:8},()=>submit(id,movement,'verified:install-a-first-move')),
  ...Array.from({length:8},(_,i)=>submit(id,movement,'verified:install-b-retry-'+i)),
 ];
 await Promise.all(attempts);
 assert.equal(Number((await state(id)).real_total_xp),100);
 assert.equal(await count('reward_ledger',id),1);
 assert.equal(await count('verification_summaries',id),1);
 const completions=await db.query("select count(*)::int as n from public.quest_completions where user_id=$1 and quest_id='first_movement_v1'",[id]);
 assert.equal(completions.rows[0].n,1);
});


test('MOVE privacy: students and children cannot query peers individual contribution rows',async()=>{
 const parent=await user(),childA=await user(),childB=await user();
 const group=(await asUser(parent,"select public.create_move_group('FAMILY','Children privacy check') as id")).rows[0].id;
 const invite=(await asUser(parent,"select public.create_move_group_invite($1,'CHILD',2,24) as code",[group])).rows[0].code;
 await asUser(childA,'select public.join_move_group($1)',[invite]);
 await asUser(childB,'select public.join_move_group($1)',[invite]);
 await db.query(`insert into public.move_contributions
   (group_id,user_id,event_key,quest_id,verified_minutes,verification_method,verification_score,day_key)
   values($1,$2,'move:a','move_walk_10',10,'GPS',90,current_date),
         ($1,$3,'move:b','move_walk_10',10,'GPS',90,current_date)`,[group,childA,childB]);
 const childRoster=(await asUser(childA,'select user_id from public.move_group_members where group_id=$1',[group])).rows;
 assert.deepEqual(childRoster.map(row=>row.user_id),[childA]);
 const guardianRoster=(await asUser(parent,'select user_id from public.move_group_members where group_id=$1',[group])).rows;
 assert.deepEqual(guardianRoster.map(row=>row.user_id).sort(),[parent,childA,childB].sort());
 const a=(await asUser(childA,'select user_id from public.move_contributions where group_id=$1',[group])).rows;
 assert.deepEqual(a.map(row=>row.user_id),[childA]);
 const guardian=(await asUser(parent,'select user_id from public.move_contributions where group_id=$1',[group])).rows;
 assert.deepEqual(guardian.map(row=>row.user_id).sort(),[childA,childB].sort());
 const other=(await asUser(childA,'select * from public.get_move_group_leaderboard($1)',[group])).rows;
 assert.equal(other.length,0);
});
function adaptiveEvidence(template='learn_read', options={}) {
 const {day='2026-09-18',minutes=2,count=1,difficulty=1,weekly=3,tier='easy'}=options;
 const base=generated.generatedQuest(`daily:${day}:g1_${template}_${tier}`);
 const seconds=Math.floor(minutes*60/count),speed=base.activityType==='BIKE'?4:base.activityType==='RUN'?2.5:1.25;
 const target=Math.floor(Math.min(base.progressTarget,base.verification.type==='TIMER'?seconds:seconds*speed));
 const q=generated.generatedQuest(base.id+`:a1:${difficulty}:${target}`);
 return {...generatedEvidence(template,tier,day),quest_id:q.id,duration_seconds:q.verification.minimumDurationSeconds??Math.max(120,target),distance_meters:q.verification.minimumDistanceMeters??0,
 adaptive:{version:1,available_minutes:minutes,daily_count:count,difficulty,weekly_target:weekly}};
}

test('a2 server rewards equal mobile preview and retries or legacy aliases cannot reward twice',async()=>{
 for(const minutes of [2,45]){
  const id=await user();await awakening(id);const p=adaptiveEvidence('learn_read',{minutes});p.quest_id=p.quest_id.replace(':a1:',':a2:');
  const before=Number((await state(id)).real_total_xp),q=generated.generatedQuest(p.quest_id);
  const key=await submit(id,{...p,real_xp:999999},'a2:first');
  assert.equal((await event(key)).processing_status,'PROCESSED');assert.ok(q);
  const expected=minutes===2?12:30;
  assert.equal(q.rewards.realXp,expected);assert.equal(Number((await state(id)).real_total_xp),before+expected);
  const ledger=(await db.query('SELECT real_xp,skill_rewards FROM public.reward_ledger WHERE user_id=$1 AND evidence_event_key=$2',[id,'a2:first'])).rows[0];
  assert.equal(ledger.real_xp,q.rewards.realXp);assert.deepEqual(ledger.skill_rewards,JSON.parse(JSON.stringify(q.rewards.skillXp)));
  await submit(id,p,'a2:first');await submit(id,p,'a2:second-device');
  await submit(id,{...p,quest_id:p.quest_id.replace(':a2:',':a1:')},'a2:legacy-replay');
  assert.equal(Number((await state(id)).real_total_xp),before+expected);
 }
});

test('a2 GPS scaling preserves target verification and rejects forged shortening',async()=>{
 const id=await user();await awakening(id);const p=adaptiveEvidence('walk_reset');p.quest_id=p.quest_id.replace(':a1:',':a2:');
 const before=Number((await state(id)).real_total_xp),q=generated.generatedQuest(p.quest_id);
 const forged=await submit(id,{...p,quest_id:p.quest_id.replace(/:150$/,':1')},'a2:forged');
 assert.equal((await event(forged)).rejection_reason,'INVALID_ADAPTIVE_TARGET');
 const valid=await submit(id,p,'a2:walk');assert.equal((await event(valid)).processing_status,'PROCESSED');
 assert.equal(q.rewards.realXp,7);assert.equal(Number((await state(id)).real_total_xp),before+7);
 const other=await user();const stolen=await submit(other,{...p,user_id:id},'a2:stolen');assert.equal((await event(stolen)).processing_status,'REJECTED');assert.equal(Number((await state(other)).real_total_xp),0);
});

test('a2 legacy timer shares proportional rewards and does not change existing a1 grants',async()=>{
 const id=await user();await awakening(id);
 const q=loadMobile('daily/templates').dailyQuest('daily:2026-09-18:focus_session:a2:1:120');
 const p={quest_id:q.id,verification_type:'TIMER',verification_score:100,duration_seconds:120,adaptive:{version:1,available_minutes:2,daily_count:1,difficulty:1,weekly_target:3}};
 const before=Number((await state(id)).real_total_xp);
 const key=await submit(id,p,'a2:legacy-timer');assert.equal((await event(key)).processing_status,'PROCESSED');
 assert.equal(q.rewards.realXp,8);assert.equal(Number((await state(id)).real_total_xp),before+q.rewards.realXp);
 assert.equal(loadMobile('daily/templates').dailyQuest(q.id.replace(':a2:',':a1:')).rewards.realXp,60);
});
test('adaptive valid g1 contract uses server rewards and rejects changed target, tier and device replays',async()=>{
 const id=await user();await awakening(id);const p=adaptiveEvidence();const before=Number((await state(id)).real_total_xp);
 const key=await submit(id,{...p,real_xp:999999},'adaptive:valid');assert.equal((await event(key)).processing_status,'PROCESSED');
 assert.equal(Number((await state(id)).real_total_xp),before+30);
 assert.equal(await submit(id,p,'adaptive:valid'),key);
 const replay=await submit(id,p,'adaptive:other-device');assert.equal((await event(replay)).rejection_reason,'DUPLICATE');
 const forged=await submit(id,{...p,quest_id:p.quest_id.replace(':120',':1')},'adaptive:forged');assert.equal((await event(forged)).processing_status,'REJECTED');
 assert.equal(Number((await state(id)).real_total_xp),before+30);
});
for(const patch of [{daily_count:5},{available_minutes:1},{difficulty:6},{weekly_target:1},{daily_count:'1'},{version:2}])test('adaptive rejects forged plan '+JSON.stringify(patch),async()=>{
 const id=await user();await awakening(id);const p=adaptiveEvidence();const key=await submit(id,{...p,adaptive:{...p.adaptive,...patch}},'adaptive:bad');assert.equal((await event(key)).processing_status,'REJECTED');assert.equal((await count('quest_completions',id)),4);
});
test('adaptive pending evidence can be enriched once after upgrade without changing its evidence',async()=>{
 const id=await user();await awakening(id);const p=adaptiveEvidence(),{adaptive,...old}=p;const key=await submit(id,old,'adaptive:legacy');
 assert.equal((await event(key)).processing_status,'RECEIVED');assert.equal((await event(key)).rejection_reason,'ADAPTIVE_CONTEXT_REQUIRED');
 await submit(id,{...p,duration_seconds:9999},'adaptive:legacy');assert.equal((await event(key)).processing_status,'RECEIVED');
 await submit(id,p,'adaptive:legacy');assert.equal((await event(key)).processing_status,'PROCESSED');
 await submit(id,p,'adaptive:legacy');assert.equal(await count('quest_completions',id),5);
});
test('adaptive day and week budgets stay frozen and cannot be bypassed with legacy IDs',async()=>{
 const id=await user();await awakening(id);const p=adaptiveEvidence();await submit(id,p,'adaptive:first');
 const changed=adaptiveEvidence('learn_question',{minutes:45,count:3});const mismatch=await submit(id,changed,'adaptive:changed');assert.equal((await event(mismatch)).processing_status,'REJECTED');
 const bypass=await submit(id,generatedEvidence('learn_question'),'adaptive:legacy-bypass');assert.equal((await event(bypass)).rejection_reason,'DAILY_LIMIT');
 const clear=await submit(id,{quest_id:'daily_clear:2026-09-18',verification_type:'MULTI',verification_score:100},'adaptive:clear');assert.equal((await event(clear)).processing_status,'PROCESSED');
 for(const day of ['2026-09-19','2026-09-20'])assert.equal((await event(await submit(id,adaptiveEvidence('learn_question',{day}),'adaptive:'+day))).processing_status,'PROCESSED');
 const weekly=await submit(id,{quest_id:'weekly_complete:2026-W38',verification_type:'MULTI',verification_score:100},'adaptive:weekly');assert.equal((await event(weekly)).processing_status,'PROCESSED');
 const replay=await submit(id,{quest_id:'weekly_complete:2026-W38',verification_type:'MULTI',verification_score:100},'adaptive:weekly-replay');assert.equal((await event(replay)).rejection_reason,'DUPLICATE');
});
test('adaptive private plans cannot be read or written by clients or applied to another user',async()=>{
 const id=await user(),other=await user();await awakening(id);const p=adaptiveEvidence();
 const key=await submit(id,{...p,user_id:other},'adaptive:owner');assert.equal((await event(key)).processing_status,'REJECTED');
 await assert.rejects(asUser(id,'SELECT * FROM private.adaptive_sync_days'));
 await assert.rejects(asUser(id,"INSERT INTO private.adaptive_sync_days(user_id,day_key,plan) VALUES($1,'2026-09-18','{}')",[other]));
});
test('adaptive Boss persists difficulty, requires later-day accepted Daily and pays once',async()=>{
 const id=await user();await awakening(id);
 await db.query("INSERT INTO public.reward_ledger(user_id,ledger_key,reward_code,source_type,source_id) VALUES($1,'trusted-world','WORLD_LINK_COMPLETE','VERIFIED_EVENT','world_link_chapter_2')",[id]);
 const p={quest_id:'wall_focus_v1',verification_type:'TIMER',verification_score:100,duration_seconds:600,completed_day:'2026-09-18'};
 const legacy=await submit(id,p,'adaptive:boss-focus','VERIFIED_EVENT',p.quest_id,'2026-09-18T10:00:00Z');assert.equal((await event(legacy)).rejection_reason,'BELOW_DURATION');
 await submit(id,{...p,adaptive_boss_difficulty:1},'adaptive:boss-focus','VERIFIED_EVENT',p.quest_id,'2026-09-18T10:00:00Z');assert.equal((await event(legacy)).processing_status,'PROCESSED');
 const move={quest_id:'wall_walk_v1',verification_type:'GPS_DISTANCE',verification_score:100,distance_meters:1000,duration_seconds:900,completed_day:'2026-09-18',adaptive_boss_difficulty:1,activity:{expected:'WALK',detected:'WALK',verdict:'VERIFIED'}};
 const invalid=await submit(id,{...move,adaptive_boss_difficulty:2,distance_meters:2000},'adaptive:boss-change','VERIFIED_EVENT',move.quest_id,'2026-09-18T11:00:00Z');assert.equal((await event(invalid)).rejection_reason,'ADAPTIVE_PLAN_CONFLICT');
 const key=await submit(id,move,'adaptive:boss-move','VERIFIED_EVENT',move.quest_id,'2026-09-18T11:00:00Z');assert.equal((await event(key)).processing_status,'PROCESSED');
 const final={quest_id:'the_first_wall_v1',verification_type:'MULTI',verification_score:100};const claim=await submit(id,final,'adaptive:boss-complete');assert.equal((await event(claim)).processing_status,'RECEIVED');
 await submit(id,adaptiveEvidence(),'adaptive:boss-same-day');await asUser(id,'SELECT public.process_pending_sync_events()');assert.equal((await event(claim)).processing_status,'RECEIVED');
 await submit(id,adaptiveEvidence('learn_question',{day:'2026-09-19'}),'adaptive:boss-next-day');await asUser(id,'SELECT public.process_pending_sync_events()');assert.equal((await event(claim)).processing_status,'PROCESSED');
 const replay=await submit(id,final,'adaptive:boss-replay');assert.equal((await event(replay)).rejection_reason,'DUPLICATE');
});
test('adaptive invalid IDs, short evidence and sensor mismatches cannot issue rewards',async()=>{
 for(const mutate of [p=>({...p,quest_id:p.quest_id.replace('g1_learn_read_easy','g9_unknown_easy')}),p=>({...p,quest_id:p.quest_id+':junk'}),p=>({...p,duration_seconds:119}),p=>({...p,verification_score:99}),p=>({...p,quest_id:p.quest_id.replace(':a1:1:',':a1:6:')})]){
  const id=await user();await awakening(id);const before=Number((await state(id)).real_total_xp);const key=await submit(id,mutate(adaptiveEvidence()),'adaptive:invalid');assert.equal((await event(key)).processing_status,'REJECTED');assert.equal(Number((await state(id)).real_total_xp),before);
 }
 const id=await user();await awakening(id);const move=adaptiveEvidence('walk_reset');const key=await submit(id,{...move,activity:{expected:'WALK',detected:'BIKE',verdict:'VERIFIED'}},'adaptive:wrong-activity');assert.equal((await event(key)).rejection_reason,'INVALID_VERIFICATION');
 const valid=await submit(id,move,'adaptive:valid-gps');assert.equal((await event(valid)).processing_status,'PROCESSED');
});
test('adaptive budgets and XP roll back together on processor failure and concurrent replays',async()=>{
 const id=await user();await awakening(id);const p=adaptiveEvidence();
 await db.exec("CREATE FUNCTION public.adaptive_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fault'; END $$; CREATE TRIGGER adaptive_fault BEFORE INSERT ON public.verification_summaries FOR EACH ROW EXECUTE FUNCTION public.adaptive_fault();");
 let key;try{key=await submit(id,p,'adaptive:rollback');assert.equal((await event(key)).processing_status,'RECEIVED');assert.equal((await db.query('SELECT count(*) n FROM private.adaptive_sync_days WHERE user_id=$1',[id])).rows[0].n,0);}finally{await db.exec('DROP TRIGGER adaptive_fault ON public.verification_summaries; DROP FUNCTION public.adaptive_fault();');}
 await Promise.all([submit(id,p,'adaptive:rollback'),submit(id,p,'adaptive:parallel')]);assert.equal(await count('quest_completions',id),5);assert.equal(Number((await state(id)).real_total_xp),630);
});
test('adaptive fourth slot requires trusted prior activity and does not allow a fifth',async()=>{
 const id=await user();await awakening(id);const p=adaptiveEvidence('learn_read',{minutes:60,count:4,difficulty:3,weekly:5});
 const key=await submit(id,p,'adaptive:fourth-plan');assert.equal((await event(key)).processing_status,'RECEIVED');
 await submit(id,generatedEvidence('learn_question','easy','2026-09-17'),'adaptive:too-old'); // below launch boundary: rejected
 for(const template of ['learn_question','learn_recall'])assert.equal((await event(await submit(id,generatedEvidence(template),'adaptive:history:'+template))).processing_status,'PROCESSED');
 // Start the four-slot plan on the following day; all five accepted direct activities are now server-owned.
 const next=adaptiveEvidence('learn_read',{day:'2026-09-19',minutes:60,count:4,difficulty:3,weekly:5});assert.equal((await event(await submit(id,next,'adaptive:four-plan-next'))).processing_status,'PROCESSED');
 for(const template of ['learn_question','learn_recall','learn_explain'])assert.equal((await event(await submit(id,adaptiveEvidence(template,{day:'2026-09-19',minutes:60,count:4,difficulty:3,weekly:5}),'adaptive:four:'+template))).processing_status,'PROCESSED');
 const extra=await submit(id,adaptiveEvidence('learn_language',{day:'2026-09-19',minutes:60,count:4,difficulty:3,weekly:5}),'adaptive:fifth');assert.equal((await event(extra)).rejection_reason,'DAILY_LIMIT');
});
test('adaptive recovery cannot forge HARD rewards and tier changes cannot reward one template twice',async()=>{
 const id=await user();await awakening(id);let before=0;for(let level=1;level<8;level++)before+=progression.xpNeededForRealLevel(level);await db.query("UPDATE public.player_progress SET real_level=8,real_total_xp=$2,rank='D' WHERE user_id=$1",[id,before]);
 const forged=adaptiveEvidence('learn_read',{tier:'hard',difficulty:1});const key=await submit(id,forged,'adaptive:forged-tier');assert.equal((await event(key)).rejection_reason,'INVALID_ADAPTIVE_PLAN');
 const valid=adaptiveEvidence('learn_read',{difficulty:2,count:3,minutes:45,weekly:5});assert.equal((await event(await submit(id,valid,'adaptive:tier-easy'))).processing_status,'PROCESSED');
 const changed=adaptiveEvidence('learn_read',{tier:'hard',difficulty:2,count:3,minutes:45,weekly:5});const replay=await submit(id,changed,'adaptive:tier-hard');assert.equal((await event(replay)).rejection_reason,'DUPLICATE');
 assert.equal(Number((await state(id)).real_total_xp),before+30);
});
test('adaptive Weekly target survives return from BUSY to a larger NORMAL daily plan',async()=>{
 const id=await user();await awakening(id);
 assert.equal((await event(await submit(id,adaptiveEvidence(),'adaptive:busy-day'))).processing_status,'PROCESSED');
 const normal=adaptiveEvidence('learn_question',{day:'2026-09-19',minutes:45,count:3,difficulty:2,weekly:3});
 assert.equal((await event(await submit(id,normal,'adaptive:normal-day'))).processing_status,'PROCESSED');
 assert.equal((await db.query("SELECT target FROM private.adaptive_sync_weeks WHERE user_id=$1 AND week_key='2026-W38'",[id])).rows[0].target,3);
});
