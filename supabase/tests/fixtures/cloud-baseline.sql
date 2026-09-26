-- Test-only deployed cloud baseline preceding the repository migrations.
-- No user data; applied only to an ephemeral PostgreSQL test database.
-- Test-only snapshot of deployed pre-social migrations, read from migration history.
-- Historical migrations in supabase/migrations are not modified.
-- 20260919045418 system_core_cloud_schema_v1

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text,
  account_status text not null default 'active'
    check (account_status in ('active','suspended','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  real_level integer not null default 1 check (real_level >= 1),
  rank text not null default 'E',
  real_xp bigint not null default 0 check (real_xp >= 0),
  energy integer not null default 0 check (energy >= 0),
  evolution_stage integer not null default 0 check (evolution_stage >= 0),
  selected_title text,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table public.skill_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_key text not null
    check (skill_key in ('STR','VIT','INT','WIL','CHA','CRE','RES')),
  level integer not null default 1 check (level >= 1),
  xp bigint not null default 0 check (xp >= 0),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_key)
);

create table public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_key text not null,
  quest_id text not null,
  quest_instance_id text,
  completed_at timestamptz not null default now(),
  reward_fingerprint text,
  revision bigint not null default 0 check (revision >= 0),
  unique (user_id, completion_key)
);

create table public.story_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  arc_id text not null,
  chapter_id text not null,
  status text not null default 'LOCKED'
    check (status in ('LOCKED','AVAILABLE','ACTIVE','COMPLETED')),
  milestones jsonb not null default '{}'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, arc_id, chapter_id)
);

create table public.sync_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);

create index quest_completions_user_completed_idx
  on public.quest_completions (user_id, completed_at desc);

create index sync_events_user_created_idx
  on public.sync_events (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger player_progress_set_updated_at
before update on public.player_progress
for each row execute function public.set_updated_at();

create trigger skill_progress_set_updated_at
before update on public.skill_progress
for each row execute function public.set_updated_at();

create trigger story_progress_set_updated_at
before update on public.story_progress
for each row execute function public.set_updated_at();

create or replace function public.handle_new_system_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'locale', '')
  )
  on conflict (id) do nothing;

  insert into public.player_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.skill_progress (user_id, skill_key)
  values
    (new.id, 'STR'),
    (new.id, 'VIT'),
    (new.id, 'INT'),
    (new.id, 'WIL'),
    (new.id, 'CHA'),
    (new.id, 'CRE'),
    (new.id, 'RES')
  on conflict (user_id, skill_key) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_system
after insert on auth.users
for each row execute function public.handle_new_system_user();

alter table public.profiles enable row level security;
alter table public.player_progress enable row level security;
alter table public.skill_progress enable row level security;
alter table public.quest_completions enable row level security;
alter table public.story_progress enable row level security;
alter table public.sync_events enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.player_progress to authenticated;
grant select, insert, update, delete on public.skill_progress to authenticated;
grant select, insert, update, delete on public.quest_completions to authenticated;
grant select, insert, update, delete on public.story_progress to authenticated;
grant select, insert on public.sync_events to authenticated;

create policy "profiles_select_own"
on public.profiles for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_delete_own"
on public.profiles for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "player_progress_select_own"
on public.player_progress for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "player_progress_insert_own"
on public.player_progress for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "player_progress_update_own"
on public.player_progress for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "player_progress_delete_own"
on public.player_progress for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "skill_progress_select_own"
on public.skill_progress for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "skill_progress_insert_own"
on public.skill_progress for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "skill_progress_update_own"
on public.skill_progress for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "skill_progress_delete_own"
on public.skill_progress for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "quest_completions_select_own"
on public.quest_completions for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "quest_completions_insert_own"
on public.quest_completions for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "quest_completions_update_own"
on public.quest_completions for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "quest_completions_delete_own"
on public.quest_completions for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "story_progress_select_own"
on public.story_progress for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "story_progress_insert_own"
on public.story_progress for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "story_progress_update_own"
on public.story_progress for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "story_progress_delete_own"
on public.story_progress for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "sync_events_select_own"
on public.sync_events for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "sync_events_insert_own"
on public.sync_events for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- 20260919045436 secure_new_user_trigger_function

    revoke execute on function public.handle_new_system_user()
    from public, anon, authenticated;

-- 20260919045547 harden_progression_write_access

    -- Progression and story are server-authoritative: mobile clients may read,
    -- but cannot directly mint XP, levels, rewards or story completion.
    revoke insert, update, delete on public.player_progress from authenticated;
    revoke insert, update, delete on public.skill_progress from authenticated;
    revoke insert, update, delete on public.quest_completions from authenticated;
    revoke insert, update, delete on public.story_progress from authenticated;

    drop policy if exists "player_progress_insert_own" on public.player_progress;
    drop policy if exists "player_progress_update_own" on public.player_progress;
    drop policy if exists "player_progress_delete_own" on public.player_progress;

    drop policy if exists "skill_progress_insert_own" on public.skill_progress;
    drop policy if exists "skill_progress_update_own" on public.skill_progress;
    drop policy if exists "skill_progress_delete_own" on public.skill_progress;

    drop policy if exists "quest_completions_insert_own" on public.quest_completions;
    drop policy if exists "quest_completions_update_own" on public.quest_completions;
    drop policy if exists "quest_completions_delete_own" on public.quest_completions;

    drop policy if exists "story_progress_insert_own" on public.story_progress;
    drop policy if exists "story_progress_update_own" on public.story_progress;
    drop policy if exists "story_progress_delete_own" on public.story_progress;

    -- Profiles remain user-editable. Sync events are an untrusted client inbox/log:
    -- they can be inserted and read by their owner, but do not grant rewards by themselves.
    revoke update, delete on public.sync_events from authenticated;

-- 20260919050117 system_cloud_platform_foundation_v2

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Keep mutable profile fields narrow: users may edit name/locale only.
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, locale) on public.profiles to authenticated;

-- Add cumulative XP ledgers so cloud state survives future progression-curve changes.
alter table public.player_progress
  add column if not exists real_total_xp bigint not null default 0 check (real_total_xp >= 0);

alter table public.skill_progress
  add column if not exists total_xp bigint not null default 0 check (total_xp >= 0);

-- User-owned settings that are safe to sync.
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'AUTO' check (language in ('AUTO','PL','EN')),
  unit_system text not null default 'AUTO' check (unit_system in ('AUTO','METRIC','IMPERIAL')),
  music_enabled boolean not null default true,
  sfx_enabled boolean not null default true,
  haptics_enabled boolean not null default true,
  reduced_motion boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  install_id text not null,
  platform text not null default 'unknown' check (platform in ('android','ios','web','unknown')),
  app_version text,
  build_number text,
  capabilities jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, install_id)
);

create table if not exists public.title_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_key text not null,
  source_type text,
  source_id text,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, title_key)
);

create table if not exists public.daily_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','CLEARED','EXPIRED')),
  completed_quest_count integer not null default 0 check (completed_quest_count >= 0),
  clear_completed boolean not null default false,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_date)
);

create table if not exists public.weekly_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','COMPLETED','EXPIRED')),
  completed_challenge_count integer not null default 0 check (completed_challenge_count >= 0),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_key)
);

create table if not exists public.streak_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_days integer not null default 0 check (current_days >= 0),
  best_days integer not null default 0 check (best_days >= 0),
  last_qualifying_date date,
  milestones jsonb not null default '{}'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.world_sectors (
  user_id uuid not null references auth.users(id) on delete cascade,
  sector_id text not null,
  first_discovered_at timestamptz not null default now(),
  source text not null default 'world',
  primary key (user_id, sector_id)
);

create table if not exists public.world_signals (
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_id text not null,
  status text not null default 'DETECTED'
    check (status in ('DETECTED','LOCATED','RELOCATED','EXPIRED')),
  sector_id text,
  detected_at timestamptz not null default now(),
  located_at timestamptz,
  revision bigint not null default 0 check (revision >= 0),
  primary key (user_id, signal_id)
);

create table if not exists public.quest_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id text not null,
  quest_id text not null,
  quest_instance_id text,
  started_at timestamptz not null,
  ended_at timestamptz,
  result text check (result in ('COMPLETED','INTERRUPTED','FAILED','SUSPICIOUS','REJECTED','ABANDONED')),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  distance_meters integer check (distance_meters is null or distance_meters >= 0),
  reason_code text,
  created_at timestamptz not null default now(),
  primary key (user_id, attempt_id)
);

create table if not exists public.chronicle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  type text not null,
  title text not null,
  subtitle text,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);

create table if not exists public.boss_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  boss_id text not null,
  status text not null default 'LOCKED' check (status in ('LOCKED','AVAILABLE','ACTIVE','COMPLETED')),
  stages jsonb not null default '{}'::jsonb,
  started_local_date date,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, boss_id)
);

-- Sanitized summaries only; never raw GPS routes/sensor streams/photos.
create table if not exists public.verification_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  activity_type text,
  verdict text not null check (verdict in ('VERIFIED','SUSPICIOUS','REJECTED')),
  confidence_score integer check (confidence_score is null or (confidence_score between 0 and 100)),
  distance_meters integer check (distance_meters is null or distance_meters >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  reason_codes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);

create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('Crash','GPS','Quest','World','Audio','Avatar','Notifications','UI','Other')),
  message text not null check (char_length(message) between 1 and 5000),
  app_version text,
  diagnostics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  status text not null default 'OPEN' check (status in ('OPEN','REVIEWING','RESOLVED','CLOSED'))
);

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('TERMS','PRIVACY')),
  document_version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, document_type, document_version)
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  status text not null default 'REQUESTED' check (status in ('REQUESTED','PROCESSING','COMPLETED','CANCELLED')),
  reason text
);

-- Reward metadata and immutable ledger. Clients can read; only backend writes ledger.
create table if not exists public.reward_catalog (
  reward_code text primary key,
  real_xp integer not null default 0 check (real_xp >= 0),
  energy integer not null default 0 check (energy >= 0),
  skill_rewards jsonb not null default '{}'::jsonb,
  title_key text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_key text not null,
  reward_code text not null references public.reward_catalog(reward_code),
  source_type text not null,
  source_id text,
  evidence_event_key text,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (user_id, claim_key)
);

create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ledger_key text not null,
  reward_code text not null references public.reward_catalog(reward_code),
  real_xp integer not null default 0,
  energy integer not null default 0,
  skill_rewards jsonb not null default '{}'::jsonb,
  title_key text,
  source_type text not null,
  source_id text,
  granted_at timestamptz not null default now(),
  unique (user_id, ledger_key)
);

-- Remote flags and release gating.
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  min_app_version text,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_releases (
  platform text not null check (platform in ('android','ios')),
  channel text not null check (channel in ('preview','production')),
  latest_version text not null,
  min_supported_version text not null,
  build_number text,
  force_update boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (platform, channel)
);

-- Harden existing sync queue: backend-only writes after sanitization.
alter table public.sync_events
  add column if not exists device_install_id text,
  add column if not exists client_created_at timestamptz,
  add column if not exists schema_version integer not null default 1 check (schema_version >= 1),
  add column if not exists processing_status text not null default 'RECEIVED'
    check (processing_status in ('RECEIVED','PROCESSED','REJECTED')),
  add column if not exists processed_at timestamptz,
  add column if not exists rejection_reason text;

revoke insert on public.sync_events from authenticated;
grant select on public.sync_events to authenticated;

-- Add updated_at triggers.
drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists daily_progress_set_updated_at on public.daily_progress;
create trigger daily_progress_set_updated_at before update on public.daily_progress
for each row execute function public.set_updated_at();

drop trigger if exists weekly_progress_set_updated_at on public.weekly_progress;
create trigger weekly_progress_set_updated_at before update on public.weekly_progress
for each row execute function public.set_updated_at();

drop trigger if exists streak_progress_set_updated_at on public.streak_progress;
create trigger streak_progress_set_updated_at before update on public.streak_progress
for each row execute function public.set_updated_at();

drop trigger if exists boss_progress_set_updated_at on public.boss_progress;
create trigger boss_progress_set_updated_at before update on public.boss_progress
for each row execute function public.set_updated_at();

drop trigger if exists feature_flags_set_updated_at on public.feature_flags;
create trigger feature_flags_set_updated_at before update on public.feature_flags
for each row execute function public.set_updated_at();

drop trigger if exists app_releases_set_updated_at on public.app_releases;
create trigger app_releases_set_updated_at before update on public.app_releases
for each row execute function public.set_updated_at();

-- Enable RLS everywhere exposed.
alter table public.user_settings enable row level security;
alter table public.user_devices enable row level security;
alter table public.title_unlocks enable row level security;
alter table public.daily_progress enable row level security;
alter table public.weekly_progress enable row level security;
alter table public.streak_progress enable row level security;
alter table public.world_sectors enable row level security;
alter table public.world_signals enable row level security;
alter table public.quest_attempts enable row level security;
alter table public.chronicle_entries enable row level security;
alter table public.boss_progress enable row level security;
alter table public.verification_summaries enable row level security;
alter table public.feedback_reports enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.reward_catalog enable row level security;
alter table public.reward_claims enable row level security;
alter table public.reward_ledger enable row level security;
alter table public.feature_flags enable row level security;
alter table public.app_releases enable row level security;

-- Helper ownership policies.
create policy "user_settings_select_own" on public.user_settings for select to authenticated
using ((select auth.uid()) = user_id);
create policy "user_settings_insert_own" on public.user_settings for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "user_settings_update_own" on public.user_settings for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.user_settings to authenticated;

create policy "user_devices_select_own" on public.user_devices for select to authenticated
using ((select auth.uid()) = user_id);
create policy "user_devices_insert_own" on public.user_devices for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "user_devices_update_own" on public.user_devices for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_devices_delete_own" on public.user_devices for delete to authenticated
using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.user_devices to authenticated;

-- Server-authoritative progression tables: users can read only.
grant select on public.title_unlocks, public.daily_progress, public.weekly_progress,
  public.streak_progress, public.world_sectors, public.world_signals, public.quest_attempts,
  public.chronicle_entries, public.boss_progress, public.verification_summaries,
  public.reward_claims, public.reward_ledger to authenticated;

create policy "title_unlocks_select_own" on public.title_unlocks for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily_progress_select_own" on public.daily_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "weekly_progress_select_own" on public.weekly_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "streak_progress_select_own" on public.streak_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "world_sectors_select_own" on public.world_sectors for select to authenticated using ((select auth.uid()) = user_id);
create policy "world_signals_select_own" on public.world_signals for select to authenticated using ((select auth.uid()) = user_id);
create policy "quest_attempts_select_own" on public.quest_attempts for select to authenticated using ((select auth.uid()) = user_id);
create policy "chronicle_entries_select_own" on public.chronicle_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "boss_progress_select_own" on public.boss_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "verification_summaries_select_own" on public.verification_summaries for select to authenticated using ((select auth.uid()) = user_id);
create policy "reward_claims_select_own" on public.reward_claims for select to authenticated using ((select auth.uid()) = user_id);
create policy "reward_ledger_select_own" on public.reward_ledger for select to authenticated using ((select auth.uid()) = user_id);

-- Feedback/legal/deletion writes are owner-scoped; status fields are backend-controlled.
grant select on public.feedback_reports to authenticated;
create policy "feedback_select_own" on public.feedback_reports for select to authenticated using ((select auth.uid()) = user_id);

grant select, insert on public.legal_acceptances to authenticated;
create policy "legal_select_own" on public.legal_acceptances for select to authenticated using ((select auth.uid()) = user_id);
create policy "legal_insert_own" on public.legal_acceptances for insert to authenticated
with check ((select auth.uid()) = user_id);

grant select on public.account_deletion_requests to authenticated;
create policy "deletion_select_own" on public.account_deletion_requests for select to authenticated using ((select auth.uid()) = user_id);

-- Public configuration is read-only.
grant select on public.feature_flags, public.app_releases to anon, authenticated;
create policy "feature_flags_read" on public.feature_flags for select to anon, authenticated using (true);
create policy "app_releases_read" on public.app_releases for select to anon, authenticated using (true);

-- Reward catalog visible to authenticated users; never writable by clients.
grant select on public.reward_catalog to authenticated;
create policy "reward_catalog_read" on public.reward_catalog for select to authenticated using (active = true);

-- Seed known current SYSTEM rewards without creating client write authority.
insert into public.reward_catalog (reward_code, real_xp, energy, skill_rewards, title_key)
values
  ('AWAKENING_FIRST_MOVE',100,10,'{"VIT":80}'::jsonb,null),
  ('AWAKENING_FOCUS_PROTOCOL',80,8,'{"WIL":70}'::jsonb,null),
  ('AWAKENING_FINAL_TRIAL',120,15,'{"VIT":60,"WIL":60}'::jsonb,null),
  ('AWAKENING_COMPLETE',300,0,'{}'::jsonb,null),
  ('WORLD_SIGNAL_LOCATED',50,5,'{"RES":40}'::jsonb,null),
  ('WORLD_LINK_COMPLETE',400,25,'{"RES":100}'::jsonb,'PATHFINDER'),
  ('EXTRA_MILE_COMPLETE',50,0,'{"WIL":40}'::jsonb,null),
  ('NO_TURNING_BACK_COMPLETE',60,0,'{"WIL":50}'::jsonb,null),
  ('REMATCH_BONUS',0,0,'{"WIL":15}'::jsonb,null),
  ('BOSS_FIRST_WALL_COMPLETE',500,30,'{"WIL":120,"VIT":80}'::jsonb,'WALLBREAKER')
on conflict (reward_code) do update set
  real_xp = excluded.real_xp,
  energy = excluded.energy,
  skill_rewards = excluded.skill_rewards,
  title_key = excluded.title_key,
  active = true;

insert into public.feature_flags (key, enabled, config)
values
  ('WORLD_ENABLED', true, '{}'::jsonb),
  ('BOSS_ENABLED', true, '{}'::jsonb),
  ('STORY_ENGINE_ENABLED', true, '{}'::jsonb),
  ('ACTIVITY_CLASSIFIER_ENABLED', true, '{}'::jsonb),
  ('CLOUD_SYNC_ENABLED', true, '{"mode":"beta"}'::jsonb),
  ('SPONSORED_CHALLENGES_ENABLED', false, '{}'::jsonb)
on conflict (key) do update set enabled = excluded.enabled, config = excluded.config;

insert into public.app_releases (platform, channel, latest_version, min_supported_version, build_number, force_update)
values
  ('android','preview','1.0.0','1.0.0',null,false),
  ('android','production','1.0.0','1.0.0',null,false),
  ('ios','preview','1.0.0','1.0.0',null,false),
  ('ios','production','1.0.0','1.0.0',null,false)
on conflict (platform, channel) do nothing;

-- New users receive complete equal-origin cloud state.
create or replace function public.handle_new_system_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'locale', '')
  ) on conflict (id) do nothing;

  insert into public.player_progress (user_id)
  values (new.id) on conflict (user_id) do nothing;

  insert into public.skill_progress (user_id, skill_key)
  values
    (new.id, 'STR'), (new.id, 'VIT'), (new.id, 'INT'), (new.id, 'WIL'),
    (new.id, 'CHA'), (new.id, 'CRE'), (new.id, 'RES')
  on conflict (user_id, skill_key) do nothing;

  insert into public.user_settings (user_id)
  values (new.id) on conflict (user_id) do nothing;

  insert into public.streak_progress (user_id)
  values (new.id) on conflict (user_id) do nothing;

  return new;
end;
$$;
revoke execute on function public.handle_new_system_user() from public, anon, authenticated;

-- Helpful indexes for owner-scoped queries.
create index if not exists user_devices_user_idx on public.user_devices(user_id, last_seen_at desc);
create index if not exists title_unlocks_user_idx on public.title_unlocks(user_id, unlocked_at desc);
create index if not exists daily_progress_user_idx on public.daily_progress(user_id, local_date desc);
create index if not exists weekly_progress_user_idx on public.weekly_progress(user_id, week_key desc);
create index if not exists world_sectors_user_idx on public.world_sectors(user_id, first_discovered_at desc);
create index if not exists quest_attempts_user_idx on public.quest_attempts(user_id, started_at desc);
create index if not exists chronicle_user_idx on public.chronicle_entries(user_id, created_at desc);
create index if not exists verification_user_idx on public.verification_summaries(user_id, created_at desc);
create index if not exists feedback_user_idx on public.feedback_reports(user_id, created_at desc);
create index if not exists reward_ledger_user_idx on public.reward_ledger(user_id, granted_at desc);

-- 20260919050320 submit_sync_event_rpc

create or replace function public.submit_sync_event(
  p_event_key text,
  p_entity_type text,
  p_entity_id text default null,
  p_payload jsonb default '{}'::jsonb,
  p_device_install_id text default null,
  p_client_created_at timestamptz default null,
  p_schema_version integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_id uuid;
  v_text text;
begin
  if v_user_id is null then raise exception 'UNAUTHORIZED'; end if;
  if p_event_key is null or char_length(p_event_key) < 1 or char_length(p_event_key) > 180
     or p_event_key !~ '^[A-Za-z0-9._:-]+$' then raise exception 'INVALID_EVENT_KEY'; end if;
  if p_entity_type is null or char_length(p_entity_type) < 1 or char_length(p_entity_type) > 100
     or p_entity_type !~ '^[A-Za-z0-9._:-]+$' then raise exception 'INVALID_ENTITY_TYPE'; end if;
  if p_schema_version < 1 or p_schema_version > 999 then raise exception 'INVALID_SCHEMA_VERSION'; end if;

  v_text := coalesce(p_payload, '{}'::jsonb)::text;
  if octet_length(v_text) > 16384 then raise exception 'PAYLOAD_TOO_LARGE'; end if;
  if v_text ~* '"(lat|lng|latitude|longitude|route|gps|photo|image)"[[:space:]]*:' then
    raise exception 'SENSITIVE_FIELD_REJECTED';
  end if;

  insert into public.sync_events(
    user_id,event_key,entity_type,entity_id,payload,device_install_id,
    client_created_at,schema_version,processing_status
  )
  values(
    v_user_id,p_event_key,p_entity_type,left(p_entity_id,180),coalesce(p_payload,'{}'::jsonb),
    left(p_device_install_id,180),p_client_created_at,p_schema_version,'RECEIVED'
  )
  on conflict (user_id,event_key) do update set event_key = excluded.event_key
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_sync_event(text,text,text,jsonb,text,timestamptz,integer) from public, anon;
grant execute on function public.submit_sync_event(text,text,text,jsonb,text,timestamptz,integer) to authenticated;

-- 20260919050444 sync_event_rls_and_payload_guard_v2

alter table public.sync_events
  drop constraint if exists sync_events_payload_privacy_check;

alter table public.sync_events
  add constraint sync_events_payload_privacy_check
  check (
    octet_length(payload::text) <= 16384
    and payload::text !~* '"(lat|lng|latitude|longitude|route|gps|photo|image)"[[:space:]]*:'
  );

grant insert on public.sync_events to authenticated;

drop policy if exists "sync_events_insert_own" on public.sync_events;
create policy "sync_events_insert_own"
on public.sync_events
for insert to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and processing_status = 'RECEIVED'
  and processed_at is null
  and rejection_reason is null
);

alter function public.submit_sync_event(text,text,text,jsonb,text,timestamptz,integer)
security invoker;

-- 20260919050452 backend_supporting_indexes

create index if not exists account_deletion_requests_user_idx
  on public.account_deletion_requests(user_id, requested_at desc);

create index if not exists reward_claims_reward_code_idx
  on public.reward_claims(reward_code);

create index if not exists reward_ledger_reward_code_idx
  on public.reward_ledger(reward_code);

-- 20260919050510 feedback_insert_policy_v2

grant insert on public.feedback_reports to authenticated;
drop policy if exists "feedback_insert_own" on public.feedback_reports;
create policy "feedback_insert_own"
on public.feedback_reports
for insert to authenticated
with check ((select auth.uid()) = user_id);

-- 20260919050519 deletion_request_insert_policy

grant insert on public.account_deletion_requests to authenticated;
drop policy if exists "deletion_insert_own" on public.account_deletion_requests;
create policy "deletion_insert_own"
on public.account_deletion_requests
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'REQUESTED'
);

-- 20260919050525 reward_claim_insert_policy

grant insert on public.reward_claims to authenticated;
drop policy if exists "reward_claim_insert_own" on public.reward_claims;
create policy "reward_claim_insert_own"
on public.reward_claims
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'PENDING'
  and processed_at is null
  and rejection_reason is null
);
