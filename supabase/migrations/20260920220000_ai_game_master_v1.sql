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
  quest_key text not null,
  title text not null,
  description text,
  category text,
  difficulty text,
  source text not null default 'ai' check (source in ('ai','fallback')),
  generated_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  unique(account_id, quest_key)
);

create index if not exists ai_quest_history_account_generated_idx
  on public.ai_quest_history(account_id, generated_at desc);

alter table public.ai_player_state enable row level security;
alter table public.ai_quest_history enable row level security;

create policy "ai_player_state_select_own"
  on public.ai_player_state for select
  using (auth.uid() = account_id);

create policy "ai_player_state_update_own"
  on public.ai_player_state for update
  using (auth.uid() = account_id)
  with check (auth.uid() = account_id);

create policy "ai_player_state_insert_own"
  on public.ai_player_state for insert
  with check (auth.uid() = account_id);

create policy "ai_quest_history_select_own"
  on public.ai_quest_history for select
  using (auth.uid() = account_id);

create policy "ai_quest_history_insert_own"
  on public.ai_quest_history for insert
  with check (auth.uid() = account_id);

create policy "ai_quest_history_update_own"
  on public.ai_quest_history for update
  using (auth.uid() = account_id)
  with check (auth.uid() = account_id);
