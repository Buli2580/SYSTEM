-- SYSTEM FULL AUDIT 1.0
-- Lock the public Data API down to the minimum client surface.
-- RLS remains the row-level boundary; explicit grants define which operations
-- are reachable by anon/authenticated clients at all.

revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from anon, authenticated;
revoke execute on all functions in schema public from public;

-- Public read-only configuration.
grant select on table public.feature_flags, public.app_releases to anon, authenticated;

-- Authenticated read-only progression/state.
grant select on table
  public.profiles,
  public.player_progress,
  public.skill_progress,
  public.quest_completions,
  public.story_progress,
  public.title_unlocks,
  public.daily_progress,
  public.weekly_progress,
  public.streak_progress,
  public.world_sectors,
  public.world_signals,
  public.quest_attempts,
  public.chronicle_entries,
  public.boss_progress,
  public.verification_summaries,
  public.reward_catalog,
  public.reward_ledger
to authenticated;

-- User-managed preferences/device metadata.
grant select, insert, update on table public.user_settings to authenticated;
grant select, insert, update, delete on table public.user_devices to authenticated;

-- User-submitted operational records.
grant select, insert on table
  public.feedback_reports,
  public.legal_acceptances,
  public.account_deletion_requests,
  public.reward_claims
to authenticated;

-- Sync ingress/status.
grant select, insert on table public.sync_events to authenticated;

-- Social API.
grant select on table public.social_profiles to authenticated;
grant update (handle, public_name, bio, visibility, continent_code, country_code, region_code, city_label)
  on table public.social_profiles to authenticated;
grant select, insert, delete on table public.follows to authenticated;

-- Basic profile can change only user-facing metadata.
grant update (display_name, locale) on table public.profiles to authenticated;

-- Explicit RPC surface.
grant execute on function public.get_leaderboard(text,text,integer) to authenticated;
grant execute on function public.search_players(text,integer) to authenticated;
grant execute on function public.get_sync_status() to authenticated;
grant execute on function public.submit_sync_event(text,text,text,jsonb,text,timestamptz,integer) to authenticated;

-- Future objects in public must opt into client exposure.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
