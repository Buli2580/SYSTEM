-- SYSTEM SEASONS 2.0
-- Season progression is server-authoritative and based only on verified reward events.
-- Seasonal milestones unlock presentation/cosmetic track only; no REAL XP is granted here.

create table if not exists public.season_progress_v2 (
  season_id uuid not null references public.seasons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  verified_events integer not null default 0 check(verified_events>=0),
  season_points bigint not null default 0 check(season_points>=0),
  updated_at timestamptz not null default now(),
  primary key(season_id,user_id)
);

create table if not exists public.season_events_v2 (
  season_id uuid not null references public.seasons(id) on delete cascade,
  event_key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null check(points between 1 and 1000),
  created_at timestamptz not null default now(),
  primary key(season_id,event_key),
  unique(season_id,user_id,event_key)
);

alter table public.season_progress_v2 enable row level security;
alter table public.season_events_v2 enable row level security;

drop policy if exists season_progress_v2_own on public.season_progress_v2;
create policy season_progress_v2_own on public.season_progress_v2 for select to authenticated
using(user_id=(select auth.uid()));

drop policy if exists season_events_v2_own on public.season_events_v2;
create policy season_events_v2_own on public.season_events_v2 for select to authenticated
using(user_id=(select auth.uid()));

create or replace function public.route_verified_reward_to_season_v2()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare s record;v_points integer;v_inserted integer;
begin
 if new.source_type<>'VERIFIED_EVENT' or new.evidence_event_key is null then return new; end if;
 -- Points remain bounded and server-derived. Every verified quest counts at least
 -- one seasonal point while larger canonical rewards add modest progression.
 v_points:=greatest(1,least(1000,1+floor(coalesce(new.real_xp,0)/100.0)::integer));
 for s in
   select id from public.seasons
   where now()>=starts_at and now()<ends_at
 loop
   insert into public.season_events_v2(season_id,event_key,user_id,points)
   values(s.id,new.evidence_event_key,new.user_id,v_points)
   on conflict do nothing;
   get diagnostics v_inserted=row_count;
   if v_inserted>0 then
     insert into public.season_progress_v2(season_id,user_id,verified_events,season_points,updated_at)
     values(s.id,new.user_id,1,v_points,now())
     on conflict(season_id,user_id) do update set
       verified_events=public.season_progress_v2.verified_events+1,
       season_points=public.season_progress_v2.season_points+excluded.season_points,
       updated_at=now();
   end if;
 end loop;
 return new;
end $$;

drop trigger if exists reward_ledger_season_v2_route on public.reward_ledger;
create trigger reward_ledger_season_v2_route
after insert on public.reward_ledger
for each row execute function public.route_verified_reward_to_season_v2();

create or replace function public.get_current_season_v2()
returns table(
 id uuid,
 name text,
 starts_at timestamptz,
 ends_at timestamptz,
 verified_events integer,
 season_points bigint,
 track_level integer
)
language sql stable security definer set search_path=''
as $$
 select s.id,s.name,s.starts_at,s.ends_at,
        coalesce(p.verified_events,0),
        coalesce(p.season_points,0),
        greatest(0,least(50,coalesce(p.season_points,0)::integer))
 from public.seasons s
 left join public.season_progress_v2 p
   on p.season_id=s.id and p.user_id=(select auth.uid())
 where now()>=s.starts_at and now()<s.ends_at
 order by s.starts_at desc
 limit 1
$$;

revoke all on table public.season_progress_v2,public.season_events_v2 from anon,authenticated;
grant select on table public.season_progress_v2,public.season_events_v2 to authenticated;
revoke all on function public.route_verified_reward_to_season_v2() from public,anon,authenticated;
revoke all on function public.get_current_season_v2() from public,anon;
grant execute on function public.get_current_season_v2() to authenticated;
