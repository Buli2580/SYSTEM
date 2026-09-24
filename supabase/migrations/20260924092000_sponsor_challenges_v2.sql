-- SYSTEM SPONSOR CHALLENGES 2.0
-- External/cosmetic rewards only. No sponsored REAL XP.

create table if not exists public.sponsor_challenges_v2 (
  id uuid primary key default gen_random_uuid(),
  sponsor_name text not null check(char_length(trim(sponsor_name)) between 2 and 80),
  disclosure_label text not null default 'ZADANIE SPONSOROWANE',
  title text not null check(char_length(trim(title)) between 3 and 100),
  description text not null default '',
  tier text not null default 'FREE' check(tier in ('FREE','PREMIUM')),
  metric text not null check(metric in ('QUESTS','MOVE_MINUTES','DISTANCE_KM')),
  target numeric not null check(target>0 and target<=1000000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reward_kind text not null check(reward_kind in ('BADGE','COUPON','PHYSICAL','CASH','COSMETIC')),
  reward_label text not null check(char_length(trim(reward_label)) between 2 and 120),
  rules_url text,
  status text not null default 'DRAFT' check(status in ('DRAFT','SCHEDULED','ACTIVE','ENDED')),
  created_at timestamptz not null default now(),
  constraint sponsor_challenge_time_order check(ends_at>starts_at)
);
create index if not exists sponsor_challenges_v2_active_idx on public.sponsor_challenges_v2(status,starts_at,ends_at);

create table if not exists public.sponsor_enrollments_v2 (
  challenge_id uuid not null references public.sponsor_challenges_v2(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  verified_value numeric not null default 0 check(verified_value>=0),
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key(challenge_id,user_id)
);

create table if not exists public.sponsor_events_v2 (
  challenge_id uuid not null references public.sponsor_challenges_v2(id) on delete cascade,
  event_key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  value numeric not null check(value>0),
  created_at timestamptz not null default now(),
  primary key(challenge_id,event_key),
  unique(user_id,event_key,challenge_id)
);

create table if not exists public.sponsor_reward_claims_v2 (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.sponsor_challenges_v2(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED','FULFILLED')),
  requested_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  unique(challenge_id,user_id)
);

alter table public.sponsor_challenges_v2 enable row level security;
alter table public.sponsor_enrollments_v2 enable row level security;
alter table public.sponsor_events_v2 enable row level security;
alter table public.sponsor_reward_claims_v2 enable row level security;

drop policy if exists sponsor_challenges_v2_read on public.sponsor_challenges_v2;
create policy sponsor_challenges_v2_read on public.sponsor_challenges_v2 for select to authenticated
using(status in ('SCHEDULED','ACTIVE','ENDED'));

drop policy if exists sponsor_enrollments_v2_own on public.sponsor_enrollments_v2;
create policy sponsor_enrollments_v2_own on public.sponsor_enrollments_v2 for select to authenticated
using(user_id=(select auth.uid()));

drop policy if exists sponsor_events_v2_own on public.sponsor_events_v2;
create policy sponsor_events_v2_own on public.sponsor_events_v2 for select to authenticated
using(user_id=(select auth.uid()));

drop policy if exists sponsor_reward_claims_v2_own on public.sponsor_reward_claims_v2;
create policy sponsor_reward_claims_v2_own on public.sponsor_reward_claims_v2 for select to authenticated
using(user_id=(select auth.uid()));

create or replace function public.get_sponsor_challenges_v2()
returns table(
 id uuid,sponsor_name text,disclosure_label text,title text,description text,tier text,metric text,target numeric,
 starts_at timestamptz,ends_at timestamptz,reward_kind text,reward_label text,rules_url text,status text,
 verified_value numeric,completed_at timestamptz,claim_status text
)
language sql stable security definer set search_path=''
as $$
 select c.id,c.sponsor_name,c.disclosure_label,c.title,c.description,c.tier,c.metric,c.target,
        c.starts_at,c.ends_at,c.reward_kind,c.reward_label,c.rules_url,
        case
          when c.status='ACTIVE' and now()>=c.ends_at then 'ENDED'
          when c.status='SCHEDULED' and now()>=c.starts_at and now()<c.ends_at then 'ACTIVE'
          else c.status
        end,
        coalesce(e.verified_value,0),e.completed_at,coalesce(cl.status,'')
 from public.sponsor_challenges_v2 c
 left join public.sponsor_enrollments_v2 e on e.challenge_id=c.id and e.user_id=(select auth.uid())
 left join public.sponsor_reward_claims_v2 cl on cl.challenge_id=c.id and cl.user_id=(select auth.uid())
 where c.status in ('SCHEDULED','ACTIVE','ENDED')
 order by c.ends_at asc,c.id
$$;

create or replace function public.join_sponsor_challenge_v2(p_challenge uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if not exists(
   select 1 from public.sponsor_challenges_v2 c
   where c.id=p_challenge and c.status in ('SCHEDULED','ACTIVE')
     and now()<c.ends_at
 ) then raise exception 'CHALLENGE_NOT_AVAILABLE'; end if;
 insert into public.sponsor_enrollments_v2(challenge_id,user_id)
 values(p_challenge,v_uid) on conflict do nothing;
end $$;

create or replace function public.submit_sponsor_event_v2(p_challenge uuid,p_event_key text)
returns numeric
language plpgsql security definer set search_path=''
as $$
declare
 v_uid uuid:=auth.uid();v_metric text;v_target numeric;v_value numeric;v_inserted integer;v_total numeric;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_event_key is null or p_event_key !~ '^verified:[A-Za-z0-9._:-]{1,180}$' then raise exception 'INVALID_EVENT'; end if;
 select c.metric,c.target into v_metric,v_target
 from public.sponsor_challenges_v2 c
 join public.sponsor_enrollments_v2 e on e.challenge_id=c.id and e.user_id=v_uid
 where c.id=p_challenge and c.status in ('ACTIVE','SCHEDULED') and now()>=c.starts_at and now()<c.ends_at;
 if v_metric is null then raise exception 'CHALLENGE_NOT_ACTIVE'; end if;

 if v_metric='QUESTS' then
   select 1::numeric into v_value
   from public.reward_ledger l
   where l.user_id=v_uid and l.evidence_event_key=p_event_key and l.source_type='VERIFIED_EVENT'
   limit 1;
 elsif v_metric='MOVE_MINUTES' then
   select greatest(1,floor(v.duration_seconds/60.0))::numeric into v_value
   from public.verification_summaries v
   where v.user_id=v_uid and v.event_key=p_event_key and v.verdict='VERIFIED' and coalesce(v.duration_seconds,0)>=60
   limit 1;
 elsif v_metric='DISTANCE_KM' then
   select (v.distance_meters/1000.0)::numeric into v_value
   from public.verification_summaries v
   where v.user_id=v_uid and v.event_key=p_event_key and v.verdict='VERIFIED' and coalesce(v.distance_meters,0)>0
   limit 1;
 end if;
 if v_value is null or v_value<=0 then raise exception 'UNVERIFIED_EVENT'; end if;

 insert into public.sponsor_events_v2(challenge_id,event_key,user_id,value)
 values(p_challenge,p_event_key,v_uid,v_value)
 on conflict do nothing;
 get diagnostics v_inserted=row_count;

 if v_inserted>0 then
   update public.sponsor_enrollments_v2 e
   set verified_value=e.verified_value+v_value
   where e.challenge_id=p_challenge and e.user_id=v_uid
   returning verified_value into v_total;
   update public.sponsor_enrollments_v2
   set completed_at=coalesce(completed_at,now())
   where challenge_id=p_challenge and user_id=v_uid and verified_value>=v_target;
 else
   select verified_value into v_total from public.sponsor_enrollments_v2 where challenge_id=p_challenge and user_id=v_uid;
 end if;
 return coalesce(v_total,0);
end $$;

create or replace function public.claim_sponsor_reward_v2(p_challenge uuid)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_id uuid;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if not exists(
   select 1 from public.sponsor_enrollments_v2 e
   join public.sponsor_challenges_v2 c on c.id=e.challenge_id
   where e.challenge_id=p_challenge and e.user_id=v_uid and e.verified_value>=c.target
 ) then raise exception 'CHALLENGE_NOT_COMPLETE'; end if;
 insert into public.sponsor_reward_claims_v2(challenge_id,user_id,status)
 values(p_challenge,v_uid,'PENDING')
 on conflict(challenge_id,user_id) do update set status=public.sponsor_reward_claims_v2.status
 returning id into v_id;
 return v_id;
end $$;

revoke all on table public.sponsor_challenges_v2,public.sponsor_enrollments_v2,public.sponsor_events_v2,public.sponsor_reward_claims_v2 from anon,authenticated;
grant select on table public.sponsor_challenges_v2,public.sponsor_enrollments_v2,public.sponsor_events_v2,public.sponsor_reward_claims_v2 to authenticated;

revoke all on function public.get_sponsor_challenges_v2() from public,anon;
revoke all on function public.join_sponsor_challenge_v2(uuid) from public,anon;
revoke all on function public.submit_sponsor_event_v2(uuid,text) from public,anon;
revoke all on function public.claim_sponsor_reward_v2(uuid) from public,anon;
grant execute on function public.get_sponsor_challenges_v2() to authenticated;
grant execute on function public.join_sponsor_challenge_v2(uuid) to authenticated;
grant execute on function public.submit_sponsor_event_v2(uuid,text) to authenticated;
grant execute on function public.claim_sponsor_reward_v2(uuid) to authenticated;
