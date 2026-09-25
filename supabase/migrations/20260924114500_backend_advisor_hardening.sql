-- SYSTEM backend advisor hardening 2026-09-24
-- Safe performance-only changes after AI/Social/MOVE/Season expansion.

drop policy if exists ai_player_memory_select_own on public.ai_player_memory;
create policy ai_player_memory_select_own on public.ai_player_memory
for select to authenticated
using ((select auth.uid())=account_id);

drop policy if exists ai_research_history_select_own on public.ai_research_history;
create policy ai_research_history_select_own on public.ai_research_history
for select to authenticated
using ((select auth.uid())=account_id);

drop policy if exists ai_player_state_select_own on public.ai_player_state;
create policy ai_player_state_select_own on public.ai_player_state
for select to authenticated
using ((select auth.uid())=account_id);

drop policy if exists ai_quest_history_select_own on public.ai_quest_history;
create policy ai_quest_history_select_own on public.ai_quest_history
for select to authenticated
using ((select auth.uid())=account_id);

create index if not exists sync_quest_rules_reward_code_idx
  on private.sync_quest_rules(reward_code);
create index if not exists challenge_progress_user_idx
  on public.challenge_progress(user_id);
create index if not exists guild_war_events_guild_idx
  on public.guild_war_events(guild_id);
create index if not exists guild_war_events_user_idx
  on public.guild_war_events(user_id);
create index if not exists guild_wars_created_by_idx
  on public.guild_wars(created_by);
create index if not exists guild_wars_guild_a_idx
  on public.guild_wars(guild_a);
create index if not exists guild_wars_guild_b_idx
  on public.guild_wars(guild_b);
create index if not exists guilds_owner_idx
  on public.guilds(owner_id);
create index if not exists pvp_challenges_opponent_idx
  on public.pvp_challenges(opponent_id);
create index if not exists pvp_events_user_idx
  on public.pvp_events(user_id);
create index if not exists season_events_v2_user_idx
  on public.season_events_v2(user_id);
create index if not exists season_progress_v2_user_idx
  on public.season_progress_v2(user_id);
create index if not exists social_blocks_blocked_idx
  on public.social_blocks(blocked_id);
create index if not exists sponsor_participation_v2_user_idx
  on public.sponsor_participation_v2(user_id);
create index if not exists sponsor_reward_claims_v2_user_idx
  on public.sponsor_reward_claims_v2(user_id);
