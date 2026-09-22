const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const loader = require('./mobile-loader.cjs');

function api(response) {
  const calls = [];
  const load = loader({
    './auth': { getValidSession: async () => ({ accessToken: 'token', user: { id: 'user-a' } }) },
    './http': { cloudRequest: async (...args) => { calls.push(args); return typeof response === 'function' ? response(args[0]) : response; } },
  });
  return { load, calls };
}

test('social gameplay migration declares every mobile backend surface', () => {
  const sql = fs.readFileSync(path.resolve(__dirname, '../migrations/20260922050000_social_gameplay_v1.sql'), 'utf8').toLowerCase();
  for (const name of [
    'friend_requests','social_blocks','social_activity','guilds','guild_members','raids','raid_damage',
    'seasons','social_challenges','challenge_progress','get_friend_network','get_social_feed',
    'join_guild','get_active_raids','submit_raid_damage','get_active_social_challenges',
    'social_followers_count','social_following_count','social_friends_count'
  ]) assert.ok(sql.includes(name), name);
  assert.match(sql, /evidence_event_key\s*=\s*p_event_key/);
  assert.match(sql, /p_damage is retained[\s\S]*never trusted/i);
});

test('guild rows map snake_case database columns into the mobile domain', async () => {
  const h = api([{ id:'g1', name:'Raiders', tag:'SYS', owner_id:'u1', member_count:7, level:3, xp:4200, visibility:'PUBLIC' }]);
  const rows = await h.load('cloud/guilds').listGuilds();
  assert.deepEqual(JSON.parse(JSON.stringify(rows[0])), { id:'g1', name:'Raiders', tag:'SYS', ownerId:'u1', memberCount:7, level:3, xp:4200, visibility:'PUBLIC' });
});

test('raid and season rows map database timestamps and boss fields correctly', async () => {
  const raid = api([{ id:'r1', title:'Wall', boss_hp:'1000', damage:'125', starts_at:'2026-09-22T00:00:00Z', ends_at:'2026-09-23T00:00:00Z', status:'ACTIVE' }]);
  const raids = await raid.load('cloud/raids').getActiveRaids();
  assert.equal(raids[0].bossHp,1000); assert.equal(raids[0].damage,125); assert.equal(raids[0].startsAt,'2026-09-22T00:00:00Z');

  const season = api([{ id:'s1', name:'Origin', starts_at:'2026-09-01T00:00:00Z', ends_at:'2026-10-01T00:00:00Z' }]);
  const current = await season.load('cloud/seasons').getCurrentSeason();
  assert.equal(current.startsAt,'2026-09-01T00:00:00Z'); assert.match(season.calls[0][0],/order=starts_at\.desc/);
});

test('challenge and feed RPCs normalize PostgREST rows', async () => {
  const challenge = api(pathname => pathname.includes('get_active_social_challenges')
    ? [{id:'c1',title:'Move',metric:'DISTANCE',target:'5000',starts_at:'2026-09-22T00:00:00Z',ends_at:'2026-09-23T00:00:00Z',visibility:'PUBLIC'}]
    : [{challenge_id:'c1',user_id:'u1',value:'1200',updated_at:'2026-09-22T01:00:00Z'}]);
  const apiChallenge=challenge.load('cloud/challenges');
  const rows=await apiChallenge.getSocialChallenges();const progress=await apiChallenge.getChallengeProgress('c1');
  assert.equal(rows[0].target,5000);assert.equal(rows[0].startsAt,'2026-09-22T00:00:00Z');
  assert.equal(progress[0].challengeId,'c1');assert.equal(progress[0].value,1200);

  const feed=api([{id:'e1',player_id:'u1',event_type:'LEVEL_UP',created_at:'2026-09-22T02:00:00Z',visibility:'friends',metadata:null}]);
  const events=await feed.load('cloud/feed').getActivityFeed();
  assert.equal(events[0].playerId,'u1');assert.equal(events[0].visibility,'FRIENDS');assert.deepEqual(JSON.parse(JSON.stringify(events[0].metadata)),{});
});

test('social count bigint strings become numeric UI counters', async () => {
  let n=0;
  const h=api(()=>[{count:String(++n)}]);
  const counts=await h.load('cloud/socialCore').getCloudSocialCounts();
  assert.deepEqual(JSON.parse(JSON.stringify(counts)),{followers:1,following:2,friends:3});
});


test('guild RLS avoids self-recursive membership lookup', () => {
  const sql = fs.readFileSync(path.resolve(__dirname, '../migrations/20260922050000_social_gameplay_v1.sql'), 'utf8').toLowerCase();
  assert.match(sql, /create or replace function public\.is_guild_member/);
  assert.match(sql, /guild_members_read_related[\s\S]*public\.is_guild_member\(guild_id\)/);
  assert.doesNotMatch(sql, /guild_members_read_related[\s\S]{0,400}from public\.guild_members me/);
});

test('one verified event cannot damage multiple raids', () => {
  const sql = fs.readFileSync(path.resolve(__dirname, '../migrations/20260922050000_social_gameplay_v1.sql'), 'utf8').toLowerCase();
  assert.match(sql, /unique index if not exists raid_damage_verified_event_unique[\s\S]*\(user_id,event_key\)/);
});


test('friendship pairs are unique regardless of request direction', () => {
  const sql = fs.readFileSync(path.resolve(__dirname, '../migrations/20260922050000_social_gameplay_v1.sql'), 'utf8').toLowerCase();
  assert.match(sql, /friend_requests_pair_unique[\s\S]*least\(sender_id,receiver_id\)[\s\S]*greatest\(sender_id,receiver_id\)/);
  assert.match(sql, /status='accepted'[\s\S]*return;/);
});

test('blocking prevents profiles from being followed or searched', () => {
  const sql = fs.readFileSync(path.resolve(__dirname, '../migrations/20260922050000_social_gameplay_v1.sql'), 'utf8').toLowerCase();
  assert.match(sql, /create or replace function public\.is_social_blocked/);
  assert.match(sql, /follows_insert_own_public_target[\s\S]*not public\.is_social_blocked\(followed_id\)/);
  assert.match(sql, /search_players[\s\S]*not public\.is_social_blocked\(sp\.user_id\)/);
});
