-- SYSTEM Sponsor Challenges 2.0 -- verified progress, no REAL XP rewards
create table if not exists public.sponsor_challenges_v2(
 id uuid primary key default gen_random_uuid(),
 sponsor_name text not null check(char_length(trim(sponsor_name)) between 2 and 80),
 title text not null check(char_length(trim(title)) between 3 and 100),
 description text not null default '',
 unit text not null check(unit in ('COUNT','MINUTES','KM')),
 target numeric not null check(target>0 and target<=1000000),
 tier text not null default 'FREE' check(tier in ('FREE','PREMIUM')),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 status text not null default 'DRAFT' check(status in ('DRAFT','SCHEDULED','ACTIVE','ENDED')),
 reward_kind text not null check(reward_kind in ('BADGE','COUPON','PHYSICAL','CASH','COSMETIC')),
 reward_label text not null,
 rules_url text,
 created_at timestamptz not null default now(),
 constraint sponsor_v2_time_order check(ends_at>starts_at)
);
create index if not exists sponsor_challenges_v2_active_idx on public.sponsor_challenges_v2(status,starts_at,ends_at);

create table if not exists public.sponsor_participation_v2(
 challenge_id uuid not null references public.sponsor_challenges_v2(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 verified_value numeric not null default 0 check(verified_value>=0),
 joined_at timestamptz not null default now(),
 completed_at timestamptz,
 primary key(challenge_id,user_id)
);

create table if not exists public.sponsor_events_v2(
 challenge_id uuid not null references public.sponsor_challenges_v2(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null,
 verified_delta numeric not null check(verified_delta>0),
 created_at timestamptz not null default now(),
 primary key(challenge_id,event_key),
 unique(user_id,event_key,challenge_id)
);

create table if not exists public.sponsor_reward_claims_v2(
 id uuid primary key default gen_random_uuid(),
 challenge_id uuid not null references public.sponsor_challenges_v2(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED','FULFILLED')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(challenge_id,user_id)
);

alter table public.sponsor_challenges_v2 enable row level security;
alter table public.sponsor_participation_v2 enable row level security;
alter table public.sponsor_events_v2 enable row level security;
alter table public.sponsor_reward_claims_v2 enable row level security;

drop policy if exists sponsor_challenges_v2_read on public.sponsor_challenges_v2;
create policy sponsor_challenges_v2_read on public.sponsor_challenges_v2 for select to authenticated
using(status in ('SCHEDULED','ACTIVE','ENDED'));

drop policy if exists sponsor_participation_v2_own on public.sponsor_participation_v2;
create policy sponsor_participation_v2_own on public.sponsor_participation_v2 for select to authenticated
using(user_id=(select auth.uid()));

drop policy if exists sponsor_events_v2_own on public.sponsor_events_v2;
create policy sponsor_events_v2_own on public.sponsor_events_v2 for select to authenticated
using(user_id=(select auth.uid()));

drop policy if exists sponsor_reward_claims_v2_own on public.sponsor_reward_claims_v2;
create policy sponsor_reward_claims_v2_own on public.sponsor_reward_claims_v2 for select to authenticated
using(user_id=(select auth.uid()));

create or replace function public.get_active_sponsor_challenges_v2()
returns table(id uuid,sponsor_name text,title text,description text,unit text,target numeric,tier text,starts_at timestamptz,ends_at timestamptz,reward_kind text,reward_label text,rules_url text,verified_value numeric,joined boolean,completed boolean)
language sql stable security definer set search_path=''
as $$
 select c.id,c.sponsor_name,c.title,c.description,c.unit,c.target,c.tier,c.starts_at,c.ends_at,c.reward_kind,c.reward_label,c.rules_url,
   coalesce(p.verified_value,0),p.user_id is not null,p.completed_at is not null
 from public.sponsor_challenges_v2 c
 left join public.sponsor_participation_v2 p on p.challenge_id=c.id and p.user_id=(select auth.uid())
 where c.status='ACTIVE' and now()>=c.starts_at and now()<c.ends_at
 order by c.ends_at asc
$$;

create or replace function public.join_sponsor_challenge_v2(p_challenge uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if not exists(select 1 from public.sponsor_challenges_v2 c where c.id=p_challenge and c.status='ACTIVE' and now()>=c.starts_at and now()<c.ends_at) then raise exception 'CHALLENGE_NOT_ACTIVE'; end if;
 insert into public.sponsor_participation_v2(challenge_id,user_id) values(p_challenge,v_uid) on conflict do nothing;
end $$;

create or replace function public.submit_sponsor_event_v2(p_challenge uuid,p_event_key text)
returns numeric
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_unit text;v_target numeric;v_delta numeric;v_inserted integer;v_total numeric;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_event_key is null or p_event_key !~ '^verified:[A-Za-z0-9._:-]{1,180}$' then raise exception 'INVALID_EVENT'; end if;
 select c.unit,c.target into v_unit,v_target from public.sponsor_challenges_v2 c join public.sponsor_participation_v2 p on p.challenge_id=c.id and p.user_id=v_uid where c.id=p_challenge and c.status='ACTIVE' and now()>=c.starts_at and now()<c.ends_at;
 if v_unit is null then raise exception 'NOT_JOINED'; end if;
 if not exists(select 1 from public.reward_ledger l where l.user_id=v_uid and l.evidence_event_key=p_event_key and l.source_type='VERIFIED_EVENT') then raise exception 'UNVERIFIED_EVENT'; end if;
 select case v_unit when 'COUNT' then 1 when 'MINUTES' then greatest(0,floor(coalesce(v.duration_seconds,0)/60.0)) when 'KM' then greatest(0,round((coalesce(v.distance_meters,0)/1000.0)::numeric,2)) end
 into v_delta from public.verification_summaries v where v.user_id=v_uid and v.event_key=p_event_key and v.verdict='VERIFIED' limit 1;
 if v_delta is null or v_delta<=0 then raise exception 'NO_ELIGIBLE_PROGRESS'; end if;
 insert into public.sponsor_events_v2(challenge_id,user_id,event_key,verified_delta) values(p_challenge,v_uid,p_event_key,v_delta) on conflict do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted>0 then update public.sponsor_participation_v2 set verified_value=least(v_target,verified_value+v_delta),completed_at=case when verified_value+v_delta>=v_target then coalesce(completed_at,now()) else completed_at end where challenge_id=p_challenge and user_id=v_uid; end if;
 select verified_value into v_total from public.sponsor_participation_v2 where challenge_id=p_challenge and user_id=v_uid;
 if v_total>=v_target then insert into public.sponsor_reward_claims_v2(challenge_id,user_id) values(p_challenge,v_uid) on conflict do nothing; end if;
 return coalesce(v_total,0);
end $$;

revoke all on table public.sponsor_challenges_v2,public.sponsor_participation_v2,public.sponsor_events_v2,public.sponsor_reward_claims_v2 from anon,authenticated;
grant select on table public.sponsor_challenges_v2,public.sponsor_participation_v2,public.sponsor_events_v2,public.sponsor_reward_claims_v2 to authenticated;
revoke all on function public.get_active_sponsor_challenges_v2() from public,anon;
revoke all on function public.join_sponsor_challenge_v2(uuid) from public,anon;
revoke all on function public.submit_sponsor_event_v2(uuid,text) from public,anon;
grant execute on function public.get_active_sponsor_challenges_v2() to authenticated;
grant execute on function public.join_sponsor_challenge_v2(uuid) to authenticated;
grant execute on function public.submit_sponsor_event_v2(uuid,text) to authenticated;
