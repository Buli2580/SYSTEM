create table if not exists public.ai_player_state (
  account_id uuid primary key references auth.users(id) on delete cascade,
  system_debt smallint not null default 0 check (system_debt between 0 and 3),
  difficulty_bias smallint not null default 0 check (difficulty_bias between -1 and 1),
  completion_rate_7d numeric not null default 0 check (completion_rate_7d between 0 and 1),
  last_generation_at timestamptz,
  last_briefing_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_quest_history (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  quest_key text not null check (char_length(quest_key) between 3 and 120),
  title text not null check (char_length(title) between 3 and 80),
  description text,
  category text check (
    category is null or category in ('fitness','health','productivity','learning','exploration','social','recovery')
  ),
  difficulty text check (
    difficulty is null or difficulty in ('easy','medium','hard')
  ),
  source text not null default 'ai' check (source in ('ai','fallback')),
  generated_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  unique(account_id, quest_key)
);

create index if not exists ai_quest_history_account_generated_idx
  on public.ai_quest_history(account_id, generated_at desc);

create table if not exists public.ai_player_memory (
  account_id uuid primary key references auth.users(id) on delete cascade,
  memory jsonb not null default jsonb_build_object(
    'summary','',
    'interests','[]'::jsonb,
    'preferredQuestStyles','[]'::jsonb,
    'successfulCategories','[]'::jsonb,
    'recentFailureCategories','[]'::jsonb,
    'researchTopics','[]'::jsonb
  ) check (jsonb_typeof(memory) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_research_history (
  id bigint generated always as identity primary key,
  account_id uuid not null references auth.users(id) on delete cascade,
  topics text[] not null default '{}',
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  created_at timestamptz not null default now()
);

create index if not exists ai_research_history_account_created_idx
  on public.ai_research_history(account_id, created_at desc);

alter table public.ai_player_state enable row level security;
alter table public.ai_quest_history enable row level security;
alter table public.ai_player_memory enable row level security;
alter table public.ai_research_history enable row level security;

drop policy if exists "ai_player_state_select_own" on public.ai_player_state;
create policy "ai_player_state_select_own"
  on public.ai_player_state for select
  to authenticated
  using (auth.uid() = account_id);

drop policy if exists "ai_quest_history_select_own" on public.ai_quest_history;
create policy "ai_quest_history_select_own"
  on public.ai_quest_history for select
  to authenticated
  using (auth.uid() = account_id);

drop policy if exists "ai_player_memory_select_own" on public.ai_player_memory;
create policy "ai_player_memory_select_own"
  on public.ai_player_memory for select
  to authenticated
  using (auth.uid() = account_id);

drop policy if exists "ai_research_history_select_own" on public.ai_research_history;
create policy "ai_research_history_select_own"
  on public.ai_research_history for select
  to authenticated
  using (auth.uid() = account_id);

revoke all on public.ai_player_state from anon, authenticated;
revoke all on public.ai_quest_history from anon, authenticated;
revoke all on public.ai_player_memory from anon, authenticated;
revoke all on public.ai_research_history from anon, authenticated;

grant select on public.ai_player_state to authenticated;
grant select on public.ai_quest_history to authenticated;
grant select on public.ai_player_memory to authenticated;
grant select on public.ai_research_history to authenticated;
