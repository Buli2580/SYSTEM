-- SYSTEM SOCIAL BATTLE NETWORK 2.0
-- Server-authoritative PvP, Guild Wars and referrals.

create table if not exists public.pvp_challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid not null references auth.users(id) on delete cascade,
  metric text not null check (metric in ('QUESTS','REAL_XP')),
  target bigint not null check (target between 1 and 100000),
  creator_score bigint not null default 0 check (creator_score>=0),
  opponent_score bigint not null default 0 check (opponent_score>=0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'OPEN' check (status in ('OPEN','ACTIVE','COMPLETE','EXPIRED')),
  created_at timestamptz not null default now(),
  constraint pvp_no_self check (creator_id<>opponent_id),
  constraint pvp_time_order check (ends_at>starts_at)
);
create index if not exists pvp_challenges_participants_idx on public.pvp_challenges(creator_id,opponent_id,status,ends_at desc);

create table if not exists public.pvp_events (
  challenge_id uuid not null references public.pvp_challenges(id) on delete cascade,
  event_key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  value bigint not null check (value>0),
  created_at timestamptz not null default now(),
  primary key(challenge_id,event_key),
  unique(user_id,event_key)
);

create table if not exists public.guild_wars (
  id uuid primary key default gen_random_uuid(),
  guild_a uuid not null references public.guilds(id) on delete cascade,
  guild_b uuid not null references public.guilds(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  score_a bigint not null default 0 check(score_a>=0),
  score_b bigint not null default 0 check(score_b>=0),
  status text not null default 'ACTIVE' check(status in ('ACTIVE','COMPLETE','EXPIRED')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint guild_war_distinct check(guild_a<>guild_b),
  constraint guild_war_time_order check(ends_at>starts_at)
);
create index if not exists guild_wars_active_idx on public.guild_wars(status,ends_at desc,guild_a,guild_b);

create table if not exists public.guild_war_events (
  war_id uuid not null references public.guild_wars(id) on delete cascade,
  event_key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  guild_id uuid not null references public.guilds(id) on delete cascade,
  value bigint not null check(value>0),
  created_at timestamptz not null default now(),
  primary key(war_id,event_key),
  unique(user_id,event_key)
);

create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check(code ~ '^SYS-[A-Z0-9]{8}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  referred_id uuid primary key references auth.users(id) on delete cascade,
  referrer_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDING' check(status in ('PENDING','ACTIVATED')),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  constraint referral_no_self check(referrer_id<>referred_id)
);
create index if not exists referrals_referrer_idx on public.referrals(referrer_id,status,created_at desc);

alter table public.pvp_challenges enable row level security;
alter table public.pvp_events enable row level security;
alter table public.guild_wars enable row level security;
alter table public.guild_war_events enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;

drop policy if exists pvp_participants_read on public.pvp_challenges;
create policy pvp_participants_read on public.pvp_challenges for select to authenticated
using ((select auth.uid()) in (creator_id,opponent_id));

drop policy if exists pvp_events_participant_read on public.pvp_events;
create policy pvp_events_participant_read on public.pvp_events for select to authenticated
using (exists(select 1 from public.pvp_challenges c where c.id=challenge_id and (select auth.uid()) in (c.creator_id,c.opponent_id)));

drop policy if exists guild_wars_member_read on public.guild_wars;
create policy guild_wars_member_read on public.guild_wars for select to authenticated
using (public.is_guild_member(guild_a) or public.is_guild_member(guild_b));

drop policy if exists guild_war_events_member_read on public.guild_war_events;
create policy guild_war_events_member_read on public.guild_war_events for select to authenticated
using (exists(select 1 from public.guild_wars w where w.id=war_id and (public.is_guild_member(w.guild_a) or public.is_guild_member(w.guild_b))));

drop policy if exists referral_codes_own_read on public.referral_codes;
create policy referral_codes_own_read on public.referral_codes for select to authenticated
using(user_id=(select auth.uid()));

drop policy if exists referrals_related_read on public.referrals;
create policy referrals_related_read on public.referrals for select to authenticated
using(referrer_id=(select auth.uid()) or referred_id=(select auth.uid()));

create or replace function public.create_pvp_challenge(p_opponent uuid,p_metric text,p_target bigint,p_hours integer default 24)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_id uuid;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_opponent is null or p_opponent=v_uid then raise exception 'INVALID_OPPONENT'; end if;
 if p_metric not in ('QUESTS','REAL_XP') then raise exception 'INVALID_METRIC'; end if;
 if p_target<1 or p_target>100000 then raise exception 'INVALID_TARGET'; end if;
 if p_hours<1 or p_hours>168 then raise exception 'INVALID_WINDOW'; end if;
 if public.is_social_blocked(p_opponent) then raise exception 'BLOCKED'; end if;
 insert into public.pvp_challenges(creator_id,opponent_id,metric,target,ends_at)
 values(v_uid,p_opponent,p_metric,p_target,now()+make_interval(hours=>p_hours))
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.accept_pvp_challenge(p_challenge uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 update public.pvp_challenges
 set status='ACTIVE'
 where id=p_challenge and opponent_id=v_uid and status='OPEN' and ends_at>now();
 if not found then raise exception 'PVP_NOT_AVAILABLE'; end if;
end $$;

create or replace function public.submit_pvp_event(p_challenge uuid,p_event_key text)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_metric text; v_target bigint; v_creator uuid; v_opponent uuid; v_value bigint; v_inserted integer;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_event_key is null or p_event_key !~ '^verified:[A-Za-z0-9._:-]{1,180}$' then raise exception 'INVALID_EVENT'; end if;
 select metric,target,creator_id,opponent_id into v_metric,v_target,v_creator,v_opponent
 from public.pvp_challenges where id=p_challenge and status='ACTIVE' and ends_at>now() and v_uid in (creator_id,opponent_id);
 if v_metric is null then raise exception 'PVP_NOT_ACTIVE'; end if;
 select case when v_metric='QUESTS' then 1 else greatest(1,least(5000,coalesce(l.real_xp,0))) end
 into v_value
 from public.reward_ledger l
 where l.user_id=v_uid and l.evidence_event_key=p_event_key and l.source_type='VERIFIED_EVENT'
 limit 1;
 if v_value is null then raise exception 'UNVERIFIED_EVENT'; end if;
 insert into public.pvp_events(challenge_id,event_key,user_id,value) values(p_challenge,p_event_key,v_uid,v_value) on conflict do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted=0 then return; end if;
 update public.pvp_challenges set
   creator_score=creator_score+case when v_uid=v_creator then v_value else 0 end,
   opponent_score=opponent_score+case when v_uid=v_opponent then v_value else 0 end
 where id=p_challenge;
 update public.pvp_challenges set status='COMPLETE'
 where id=p_challenge and (creator_score>=target or opponent_score>=target);
end $$;

create or replace function public.get_my_pvp_challenges()
returns table(id uuid,creator_id uuid,opponent_id uuid,metric text,target bigint,creator_score bigint,opponent_score bigint,starts_at timestamptz,ends_at timestamptz,status text)
language sql stable security invoker set search_path=''
as $$
 select c.id,c.creator_id,c.opponent_id,c.metric,c.target,c.creator_score,c.opponent_score,c.starts_at,c.ends_at,
 case when c.status in ('OPEN','ACTIVE') and c.ends_at<=now() then 'EXPIRED' else c.status end
 from public.pvp_challenges c
 where (c.creator_id=(select auth.uid()) or c.opponent_id=(select auth.uid()))
 order by c.created_at desc limit 50
$$;

create or replace function public.create_guild_war(p_opponent_guild uuid,p_hours integer default 72)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_guild uuid;v_role text;v_id uuid;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 select gm.guild_id,gm.role into v_guild,v_role from public.guild_members gm where gm.user_id=v_uid limit 1;
 if v_guild is null or v_role not in ('OWNER','OFFICER') then raise exception 'GUILD_OFFICER_REQUIRED'; end if;
 if p_opponent_guild is null or p_opponent_guild=v_guild then raise exception 'INVALID_OPPONENT_GUILD'; end if;
 if not exists(select 1 from public.guilds where id=p_opponent_guild) then raise exception 'GUILD_NOT_FOUND'; end if;
 if p_hours<6 or p_hours>168 then raise exception 'INVALID_WINDOW'; end if;
 insert into public.guild_wars(guild_a,guild_b,ends_at,created_by)
 values(v_guild,p_opponent_guild,now()+make_interval(hours=>p_hours),v_uid) returning id into v_id;
 return v_id;
end $$;

create or replace function public.submit_guild_war_event(p_war uuid,p_event_key text)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_guild uuid;v_a uuid;v_b uuid;v_value bigint;v_inserted integer;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_event_key is null or p_event_key !~ '^verified:[A-Za-z0-9._:-]{1,180}$' then raise exception 'INVALID_EVENT'; end if;
 select gm.guild_id into v_guild from public.guild_members gm where gm.user_id=v_uid limit 1;
 select guild_a,guild_b into v_a,v_b from public.guild_wars where id=p_war and status='ACTIVE' and ends_at>now();
 if v_a is null or v_guild not in (v_a,v_b) then raise exception 'WAR_NOT_ACTIVE'; end if;
 select greatest(1,least(1000,coalesce(l.real_xp,0)+coalesce(l.energy,0)*2)) into v_value
 from public.reward_ledger l where l.user_id=v_uid and l.evidence_event_key=p_event_key and l.source_type='VERIFIED_EVENT' limit 1;
 if v_value is null then raise exception 'UNVERIFIED_EVENT'; end if;
 insert into public.guild_war_events(war_id,event_key,user_id,guild_id,value) values(p_war,p_event_key,v_uid,v_guild,v_value) on conflict do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted=0 then return; end if;
 update public.guild_wars set score_a=score_a+case when v_guild=v_a then v_value else 0 end,score_b=score_b+case when v_guild=v_b then v_value else 0 end where id=p_war;
end $$;

create or replace function public.get_active_guild_wars()
returns table(id uuid,guild_a uuid,guild_b uuid,starts_at timestamptz,ends_at timestamptz,score_a bigint,score_b bigint,status text)
language sql stable security invoker set search_path=''
as $$
 select w.id,w.guild_a,w.guild_b,w.starts_at,w.ends_at,w.score_a,w.score_b,
 case when w.status='ACTIVE' and w.ends_at<=now() then 'EXPIRED' else w.status end
 from public.guild_wars w
 where public.is_guild_member(w.guild_a) or public.is_guild_member(w.guild_b)
 order by w.created_at desc limit 20
$$;

create or replace function public.ensure_referral_code()
returns text
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_code text;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 select code into v_code from public.referral_codes where user_id=v_uid;
 if v_code is null then
   v_code:='SYS-'||upper(substr(md5(v_uid::text),1,8));
   insert into public.referral_codes(user_id,code) values(v_uid,v_code) on conflict(user_id) do update set code=excluded.code returning code into v_code;
 end if;
 return v_code;
end $$;

create or replace function public.attach_referral_code(p_code text)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_referrer uuid;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 select user_id into v_referrer from public.referral_codes where code=upper(trim(p_code));
 if v_referrer is null then raise exception 'REFERRAL_NOT_FOUND'; end if;
 if v_referrer=v_uid then raise exception 'SELF_REFERRAL'; end if;
 insert into public.referrals(referred_id,referrer_id,status) values(v_uid,v_referrer,'PENDING') on conflict(referred_id) do nothing;
end $$;

create or replace function public.activate_referral(p_event_key text)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_event_key is null or p_event_key !~ '^verified:[A-Za-z0-9._:-]{1,180}$' then raise exception 'INVALID_EVENT'; end if;
 if not exists(select 1 from public.reward_ledger l where l.user_id=v_uid and l.evidence_event_key=p_event_key and l.source_type='VERIFIED_EVENT') then raise exception 'UNVERIFIED_EVENT'; end if;
 update public.referrals set status='ACTIVATED',activated_at=coalesce(activated_at,now()) where referred_id=v_uid and status='PENDING';
end $$;

create or replace function public.get_referral_state()
returns table(code text,invited bigint,activated bigint)
language plpgsql stable security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_code text;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 select rc.code into v_code from public.referral_codes rc where rc.user_id=v_uid;
 return query select coalesce(v_code,''),count(*)::bigint,count(*) filter(where r.status='ACTIVATED')::bigint from public.referrals r where r.referrer_id=v_uid;
end $$;

revoke all on table public.pvp_challenges,public.pvp_events,public.guild_wars,public.guild_war_events,public.referral_codes,public.referrals from anon,authenticated;
grant select on table public.pvp_challenges,public.pvp_events,public.guild_wars,public.guild_war_events,public.referral_codes,public.referrals to authenticated;

revoke all on function public.create_pvp_challenge(uuid,text,bigint,integer) from public,anon;
revoke all on function public.accept_pvp_challenge(uuid) from public,anon;
revoke all on function public.submit_pvp_event(uuid,text) from public,anon;
revoke all on function public.get_my_pvp_challenges() from public,anon;
revoke all on function public.create_guild_war(uuid,integer) from public,anon;
revoke all on function public.submit_guild_war_event(uuid,text) from public,anon;
revoke all on function public.get_active_guild_wars() from public,anon;
revoke all on function public.ensure_referral_code() from public,anon;
revoke all on function public.attach_referral_code(text) from public,anon;
revoke all on function public.activate_referral(text) from public,anon;
revoke all on function public.get_referral_state() from public,anon;

grant execute on function public.create_pvp_challenge(uuid,text,bigint,integer) to authenticated;
grant execute on function public.accept_pvp_challenge(uuid) to authenticated;
grant execute on function public.submit_pvp_event(uuid,text) to authenticated;
grant execute on function public.get_my_pvp_challenges() to authenticated;
grant execute on function public.create_guild_war(uuid,integer) to authenticated;
grant execute on function public.submit_guild_war_event(uuid,text) to authenticated;
grant execute on function public.get_active_guild_wars() to authenticated;
grant execute on function public.ensure_referral_code() to authenticated;
grant execute on function public.attach_referral_code(text) to authenticated;
grant execute on function public.activate_referral(text) to authenticated;
grant execute on function public.get_referral_state() to authenticated;
