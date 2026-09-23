-- SYSTEM MOVE ONLINE 1.0
-- Repository migration. Deploy only as an explicit backend release.
-- Private-by-default Family/School groups. No precise child location or body metrics are stored.

create table if not exists public.move_groups (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('FAMILY','SCHOOL')),
  name text not null check (char_length(trim(name)) between 2 and 60),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.move_group_members (
  group_id uuid not null references public.move_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('PARENT','CHILD','MEMBER','TEACHER','STUDENT')),
  joined_at timestamptz not null default now(),
  primary key(group_id,user_id)
);
create index if not exists move_group_members_user_idx on public.move_group_members(user_id,joined_at desc);

create table if not exists public.move_group_invites (
  code text primary key,
  group_id uuid not null references public.move_groups(id) on delete cascade,
  role text not null check (role in ('PARENT','CHILD','MEMBER','TEACHER','STUDENT')),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses between 1 and 100),
  used_count integer not null default 0 check (used_count>=0 and used_count<=max_uses),
  created_at timestamptz not null default now()
);
create index if not exists move_group_invites_group_idx on public.move_group_invites(group_id,expires_at);

create table if not exists public.move_contributions (
  group_id uuid not null references public.move_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  quest_id text not null,
  verified_minutes integer not null check (verified_minutes between 1 and 60),
  verification_method text not null check (verification_method in ('TIMER','GPS','STEPS','HEALTH','PARENT','MIXED')),
  verification_score integer not null check (verification_score between 0 and 100),
  day_key date not null,
  created_at timestamptz not null default now(),
  primary key(group_id,event_key)
);
create index if not exists move_contributions_group_day_idx on public.move_contributions(group_id,day_key desc,created_at desc);

alter table public.move_groups enable row level security;
alter table public.move_group_members enable row level security;
alter table public.move_group_invites enable row level security;
alter table public.move_contributions enable row level security;

create or replace function public.is_move_group_member(p_group uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(
    select 1 from public.move_group_members m
    where m.group_id=p_group and m.user_id=(select auth.uid())
  )
$$;

drop policy if exists move_groups_member_read on public.move_groups;
create policy move_groups_member_read on public.move_groups
for select to authenticated
using (owner_id=(select auth.uid()) or public.is_move_group_member(id));

drop policy if exists move_group_members_group_read on public.move_group_members;
create policy move_group_members_group_read on public.move_group_members
for select to authenticated
using (user_id=(select auth.uid()) or public.is_move_group_member(group_id));

drop policy if exists move_group_invites_creator_read on public.move_group_invites;
create policy move_group_invites_creator_read on public.move_group_invites
for select to authenticated
using (created_by=(select auth.uid()));

drop policy if exists move_contributions_group_read on public.move_contributions;
create policy move_contributions_group_read on public.move_contributions
for select to authenticated
using (user_id=(select auth.uid()) or public.is_move_group_member(group_id));

-- No direct INSERT policies: writes go through controlled RPCs.

create or replace function public.create_move_group(p_kind text,p_name text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_id uuid;
  v_kind text:=upper(trim(coalesce(p_kind,'')));
  v_name text:=trim(coalesce(p_name,''));
  v_role text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_kind not in ('FAMILY','SCHOOL') then raise exception 'INVALID_GROUP_KIND'; end if;
  if char_length(v_name) not between 2 and 60 then raise exception 'INVALID_GROUP_NAME'; end if;
  v_role:=case when v_kind='FAMILY' then 'PARENT' else 'TEACHER' end;
  insert into public.move_groups(kind,name,owner_id) values(v_kind,v_name,v_uid) returning id into v_id;
  insert into public.move_group_members(group_id,user_id,role) values(v_id,v_uid,v_role);
  return v_id;
end
$$;

create or replace function public.create_move_group_invite(
  p_group uuid,p_role text,p_max_uses integer default 1,p_expires_hours integer default 24
)
returns text language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_kind text;
  v_role text:=upper(trim(coalesce(p_role,'')));
  v_code text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select g.kind into v_kind from public.move_groups g
  where g.id=p_group and (g.owner_id=v_uid or exists(
    select 1 from public.move_group_members m where m.group_id=g.id and m.user_id=v_uid and m.role in ('PARENT','TEACHER')
  ));
  if v_kind is null then raise exception 'INVITE_NOT_ALLOWED'; end if;
  if v_kind='FAMILY' and v_role not in ('PARENT','CHILD','MEMBER') then raise exception 'INVALID_ROLE'; end if;
  if v_kind='SCHOOL' and v_role not in ('TEACHER','STUDENT') then raise exception 'INVALID_ROLE'; end if;
  if coalesce(p_max_uses,0)<1 or p_max_uses>100 then raise exception 'INVALID_MAX_USES'; end if;
  if coalesce(p_expires_hours,0)<1 or p_expires_hours>168 then raise exception 'INVALID_EXPIRY'; end if;
  loop
    v_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
    exit when not exists(select 1 from public.move_group_invites i where i.code=v_code);
  end loop;
  insert into public.move_group_invites(code,group_id,role,created_by,expires_at,max_uses)
  values(v_code,p_group,v_role,v_uid,now()+make_interval(hours=>p_expires_hours),p_max_uses);
  return v_code;
end
$$;

create or replace function public.join_move_group(p_code text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_group uuid;
  v_role text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select i.group_id,i.role into v_group,v_role
  from public.move_group_invites i
  where i.code=upper(trim(coalesce(p_code,'')))
    and i.expires_at>now()
    and i.used_count<i.max_uses
  for update;
  if v_group is null then raise exception 'INVITE_INVALID_OR_EXPIRED'; end if;

  insert into public.move_group_members(group_id,user_id,role)
  values(v_group,v_uid,v_role)
  on conflict(group_id,user_id) do nothing;

  update public.move_group_invites set used_count=used_count+1
  where code=upper(trim(p_code)) and used_count<max_uses;

  return v_group;
end
$$;

create or replace function public.submit_move_contribution(
  p_group uuid,
  p_event_key text,
  p_quest_id text,
  p_verification_method text,
  p_verification_score integer,
  p_day_key date
)
returns integer language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_minutes integer;
  v_method text:=upper(trim(coalesce(p_verification_method,'')));
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_move_group_member(p_group) then raise exception 'NOT_GROUP_MEMBER'; end if;
  if p_event_key is null or p_event_key !~ '^move:[A-Za-z0-9._:-]{1,180}$' then raise exception 'INVALID_EVENT_KEY'; end if;
  if v_method not in ('TIMER','GPS','STEPS','HEALTH','PARENT','MIXED') then raise exception 'INVALID_VERIFICATION'; end if;
  if p_verification_score is null or p_verification_score<0 or p_verification_score>100 then raise exception 'INVALID_SCORE'; end if;

  -- Server-owned minutes: never trust arbitrary client minute values.
  v_minutes:=case p_quest_id
    when 'move_walk_10' then 10
    when 'move_run_10' then 10
    when 'move_jump_5' then 5
    when 'move_balance_5' then 5
    when 'move_ball_10' then 10
    when 'move_bike_20' then 20
    when 'move_outdoor_15' then 15
    when 'move_family_30' then 30
    when 'move_coord_10' then 10
    when 'move_endurance_20' then 20
    when 'family_walk_45' then 45
    when 'family_bike_60' then 60
    when 'family_outdoor_45' then 45
    else null
  end;
  if v_minutes is null then raise exception 'UNKNOWN_MOVE_QUEST'; end if;

  insert into public.move_contributions(group_id,user_id,event_key,quest_id,verified_minutes,verification_method,verification_score,day_key)
  values(p_group,v_uid,p_event_key,p_quest_id,v_minutes,v_method,p_verification_score,p_day_key)
  on conflict(group_id,event_key) do nothing;

  return v_minutes;
end
$$;

create or replace function public.get_my_move_groups()
returns table(id uuid,kind text,name text,role text,member_count bigint,total_minutes bigint,active_days bigint)
language sql stable security definer set search_path=''
as $$
  select g.id,g.kind,g.name,m.role,
    (select count(*) from public.move_group_members gm where gm.group_id=g.id)::bigint,
    coalesce((select sum(c.verified_minutes) from public.move_contributions c where c.group_id=g.id),0)::bigint,
    coalesce((select count(distinct c.day_key) from public.move_contributions c where c.group_id=g.id),0)::bigint
  from public.move_groups g
  join public.move_group_members m on m.group_id=g.id and m.user_id=(select auth.uid())
  order by g.created_at desc
$$;

create or replace function public.get_move_group_leaderboard(p_group uuid,p_days integer default 7)
returns table(user_id uuid,verified_minutes bigint,active_days bigint,contribution_score bigint)
language sql stable security definer set search_path=''
as $$
  select c.user_id,
    sum(c.verified_minutes)::bigint,
    count(distinct c.day_key)::bigint,
    (sum(c.verified_minutes)+count(distinct c.day_key)*10)::bigint
  from public.move_contributions c
  where c.group_id=p_group
    and public.is_move_group_member(p_group)
    and c.day_key>=current_date-greatest(1,least(coalesce(p_days,7),31))+1
  group by c.user_id
  order by (sum(c.verified_minutes)+count(distinct c.day_key)*10) desc,c.user_id
$$;

revoke all on function public.create_move_group(text,text) from public;
revoke all on function public.create_move_group_invite(uuid,text,integer,integer) from public;
revoke all on function public.join_move_group(text) from public;
revoke all on function public.submit_move_contribution(uuid,text,text,text,integer,date) from public;
revoke all on function public.get_my_move_groups() from public;
revoke all on function public.get_move_group_leaderboard(uuid,integer) from public;
grant execute on function public.create_move_group(text,text) to authenticated;
grant execute on function public.create_move_group_invite(uuid,text,integer,integer) to authenticated;
grant execute on function public.join_move_group(text) to authenticated;
grant execute on function public.submit_move_contribution(uuid,text,text,text,integer,date) to authenticated;
grant execute on function public.get_my_move_groups() to authenticated;
grant execute on function public.get_move_group_leaderboard(uuid,integer) to authenticated;
