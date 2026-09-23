-- MOVE Family/School ranking hardening v2.
-- Earlier mobile-only verification submissions are NOT suitable ranking evidence.
-- This migration does not erase local MOVE minutes or historical submissions.
-- Competitive cloud credit is granted only from a separately PROCESSED core
-- VERIFIED_EVENT with a server-recorded verification summary.
-- Important: the core processor validates client evidence rules, but it is not
-- cryptographic device attestation. No paid prizes may rely on this alone.

alter table public.move_contributions
  add column if not exists evidence_event_key text,
  add column if not exists trusted_at timestamptz;
create unique index if not exists move_contributions_trusted_evidence_unique
  on public.move_contributions(group_id,user_id,evidence_event_key)
  where evidence_event_key is not null and trusted_at is not null;

-- Stop accepting an arbitrary score/verification label from a mobile request.
-- Old contributions remain for audit but are excluded from all official totals.
revoke execute on function public.submit_move_contribution(uuid,text,text,text,integer,date)
  from public,anon,authenticated;

create or replace function public.submit_verified_move_contribution(
  p_group uuid,p_evidence_event_key text,p_move_quest_id text,p_day_key date
)
returns integer language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_core_quest text;
  v_activity text;
  v_duration integer;
  v_distance integer;
  v_minutes integer;
  v_score integer;
  v_key text;
  v_rows integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_move_group_member(p_group) then raise exception 'NOT_GROUP_MEMBER'; end if;
  if p_evidence_event_key is null
    or p_evidence_event_key !~ '^verified:[A-Za-z0-9._:-]{1,180}$'
    then raise exception 'INVALID_EVIDENCE_KEY'; end if;
  if p_day_key is null or p_day_key > current_date+1
    then raise exception 'INVALID_MOVE_DAY'; end if;

  -- No generic TIMER, HEALTH or local PARENT claims are admitted to a
  -- competitive family/school board without a separately approved proof.
  -- Each mapping requires a server-approved core quest whose minimum
  -- duration/distance ALSO satisfy the corresponding MOVE quest.
  case p_move_quest_id
    when 'move_walk_10' then
      v_core_quest:='daily:'||p_day_key::text||':walk_protocol_1';
      v_activity:='WALK';v_duration:=600;v_distance:=350;v_minutes:=10;
    when 'move_run_10' then
      v_core_quest:='daily:'||p_day_key::text||':run_protocol_1';
      v_activity:='RUN';v_duration:=600;v_distance:=700;v_minutes:=10;
    when 'move_bike_20' then
      v_core_quest:='daily:'||p_day_key::text||':ride_protocol_1';
      v_activity:='BIKE';v_duration:=1200;v_distance:=2400;v_minutes:=20;
    else raise exception 'MOVE_QUEST_HAS_NO_SERVER_PROOF';
  end case;

  select vs.confidence_score into v_score
  from public.sync_events se
  join public.verification_summaries vs
    on vs.user_id=se.user_id and vs.event_key=se.event_key
  where se.user_id=v_uid
    and se.event_key=p_evidence_event_key
    and se.entity_type='VERIFIED_EVENT'
    and se.entity_id=v_core_quest
    and se.processing_status='PROCESSED'
    and vs.verdict='VERIFIED'
    and vs.activity_type=v_activity
    and coalesce(vs.confidence_score,0)>=70
    and coalesce(vs.duration_seconds,0)>=v_duration
    and coalesce(vs.distance_meters,0)>=v_distance;
  if not found then raise exception 'MOVE_SERVER_EVIDENCE_REQUIRED'; end if;

  -- The identity is derived by the server, not chosen by the client; one
  -- approved source may fund at most one MOVE claim per group.
  v_key:='move:'||md5(v_uid::text||'|'||p_evidence_event_key);
  insert into public.move_contributions(
    group_id,user_id,event_key,quest_id,verified_minutes,
    verification_method,verification_score,day_key,
    evidence_event_key,trusted_at
  ) values(
    p_group,v_uid,v_key,p_move_quest_id,v_minutes,
    'GPS',v_score,p_day_key,p_evidence_event_key,now()
  ) on conflict do nothing;
  get diagnostics v_rows=row_count;
  if v_rows=0 then return 0; end if;
  return v_minutes;
end
$$;

revoke all on function public.submit_verified_move_contribution(uuid,text,text,date)
  from public,anon;
grant execute on function public.submit_verified_move_contribution(uuid,text,text,date)
  to authenticated;

-- Aggregate only independently linked and approved evidence.
create or replace function public.get_my_move_groups()
returns table(id uuid,kind text,name text,role text,member_count bigint,total_minutes bigint,active_days bigint)
language sql stable security definer set search_path=''
as $$
  select g.id,g.kind,g.name,m.role,
    (select count(*) from public.move_group_members gm where gm.group_id=g.id)::bigint,
    coalesce((select sum(c.verified_minutes) from public.move_contributions c
      where c.group_id=g.id and c.trusted_at is not null),0)::bigint,
    coalesce((select count(distinct c.day_key) from public.move_contributions c
      where c.group_id=g.id and c.trusted_at is not null),0)::bigint
  from public.move_groups g
  join public.move_group_members m on m.group_id=g.id and m.user_id=(select auth.uid())
  order by g.created_at desc
$$;

-- Individual scores of children should not be shown to other students or
-- arbitrary invited members. Guardians/teachers only see their own group.
create or replace function public.get_move_group_leaderboard(p_group uuid,p_days integer default 7)
returns table(user_id uuid,verified_minutes bigint,active_days bigint,contribution_score bigint)
language sql stable security definer set search_path=''
as $$
  select c.user_id,
    sum(c.verified_minutes)::bigint,
    count(distinct c.day_key)::bigint,
    (sum(c.verified_minutes)+count(distinct c.day_key)*10)::bigint
  from public.move_contributions c
  where c.group_id=p_group and c.trusted_at is not null
    and c.day_key>=current_date-greatest(1,least(coalesce(p_days,7),31))+1
    and exists(
      select 1 from public.move_group_members m
      where m.group_id=p_group and m.user_id=(select auth.uid())
        and m.role in ('PARENT','TEACHER')
    )
  group by c.user_id
  order by (sum(c.verified_minutes)+count(distinct c.day_key)*10) desc,c.user_id
$$;
