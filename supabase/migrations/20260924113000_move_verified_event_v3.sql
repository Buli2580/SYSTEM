-- SYSTEM MOVE VERIFIED EVENT v3
-- Dedicated server validation for MOVE WALK/RUN/BIKE.
-- Does NOT grant REAL XP. Produces a server-owned verification summary that
-- Family/School aggregation and sponsor challenges may consume.

create or replace function public.submit_move_verified_event_v3(
  p_move_quest_id text,
  p_day_key date,
  p_duration_seconds integer,
  p_distance_meters numeric,
  p_confidence_score integer,
  p_activity_type text
)
returns text
language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_expected text;
  v_min_duration integer;
  v_min_distance integer;
  v_max_speed numeric;
  v_event_key text;
  v_event_id uuid;
  v_activity text:=upper(trim(coalesce(p_activity_type,'')));
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_day_key is null or p_day_key>current_date+1 or p_day_key<current_date-31 then
    raise exception 'INVALID_MOVE_DAY';
  end if;

  case p_move_quest_id
    when 'move_walk_10' then
      v_expected:='WALK';v_min_duration:=600;v_min_distance:=350;v_max_speed:=7;
    when 'move_run_10' then
      v_expected:='RUN';v_min_duration:=600;v_min_distance:=700;v_max_speed:=12;
    when 'move_bike_20' then
      v_expected:='BIKE';v_min_duration:=1200;v_min_distance:=2400;v_max_speed:=25;
    else
      raise exception 'MOVE_QUEST_HAS_NO_SERVER_PROOF';
  end case;

  if p_duration_seconds is null or p_duration_seconds<v_min_duration or p_duration_seconds>172800 then
    raise exception 'BELOW_DURATION';
  end if;
  if p_distance_meters is null or p_distance_meters<v_min_distance or p_distance_meters>500000 then
    raise exception 'BELOW_DISTANCE';
  end if;
  if p_confidence_score is null or p_confidence_score<70 or p_confidence_score>100
    or p_confidence_score<>trunc(p_confidence_score) then
    raise exception 'INVALID_VERIFICATION';
  end if;
  if v_activity<>v_expected then raise exception 'ACTIVITY_TYPE_MISMATCH'; end if;
  if p_distance_meters/greatest(p_duration_seconds,1)>v_max_speed then
    raise exception 'IMPOSSIBLE_SPEED';
  end if;

  v_event_key:='verified:move:'||p_day_key::text||':'||p_move_quest_id;

  insert into public.sync_events(
    user_id,event_key,entity_type,entity_id,payload,schema_version,
    processing_status,processed_at,rejection_reason
  ) values(
    v_uid,v_event_key,'MOVE_VERIFIED_EVENT',p_move_quest_id,
    jsonb_build_object(
      'quest_id',p_move_quest_id,
      'day_key',p_day_key::text,
      'verification_type','GPS_DISTANCE',
      'verification_score',p_confidence_score,
      'distance_meters',floor(p_distance_meters)::integer,
      'duration_seconds',p_duration_seconds,
      'activity',jsonb_build_object(
        'expected',v_expected,'detected',v_expected,'verdict','VERIFIED'
      )
    ),
    3,'PROCESSED',now(),null
  )
  on conflict(user_id,event_key) do update set
    payload=excluded.payload,
    schema_version=excluded.schema_version,
    processing_status='PROCESSED',
    processed_at=now(),
    rejection_reason=null
  where public.sync_events.entity_type='MOVE_VERIFIED_EVENT'
    and public.sync_events.entity_id=excluded.entity_id
  returning id into v_event_id;

  if v_event_id is null then raise exception 'MOVE_EVENT_KEY_CONFLICT'; end if;

  insert into public.verification_summaries(
    user_id,event_key,activity_type,verdict,confidence_score,
    distance_meters,duration_seconds,reason_codes
  ) values(
    v_uid,v_event_key,v_expected,'VERIFIED',p_confidence_score,
    floor(p_distance_meters)::integer,p_duration_seconds,
    '["MOVE_VERIFIED_V3"]'::jsonb
  )
  on conflict(user_id,event_key) do update set
    activity_type=excluded.activity_type,
    verdict='VERIFIED',
    confidence_score=excluded.confidence_score,
    distance_meters=excluded.distance_meters,
    duration_seconds=excluded.duration_seconds,
    reason_codes=excluded.reason_codes;

  return v_event_key;
end
$$;

create or replace function public.get_my_move_verified_source(
  p_move_quest_id text,p_day_key date
)
returns table(event_key text)
language sql stable security definer set search_path=''
as $$
  with expected as (
    select
      case p_move_quest_id
        when 'move_walk_10' then 'WALK'
        when 'move_run_10' then 'RUN'
        when 'move_bike_20' then 'BIKE'
        else null end as activity_type,
      case p_move_quest_id
        when 'move_walk_10' then 600
        when 'move_run_10' then 600
        when 'move_bike_20' then 1200
        else null end as min_duration,
      case p_move_quest_id
        when 'move_walk_10' then 350
        when 'move_run_10' then 700
        when 'move_bike_20' then 2400
        else null end as min_distance,
      case p_move_quest_id
        when 'move_walk_10' then 'daily:'||p_day_key::text||':walk_protocol_1'
        when 'move_run_10' then 'daily:'||p_day_key::text||':run_protocol_1'
        when 'move_bike_20' then 'daily:'||p_day_key::text||':ride_protocol_1'
        else null end as legacy_core_quest
  )
  select se.event_key
  from public.sync_events se
  join public.verification_summaries vs
    on vs.user_id=se.user_id and vs.event_key=se.event_key
  cross join expected x
  where se.user_id=(select auth.uid())
    and p_day_key is not null and p_day_key<=current_date+1 and p_day_key>=current_date-31
    and se.processing_status='PROCESSED'
    and vs.verdict='VERIFIED'
    and vs.confidence_score>=70
    and vs.activity_type=x.activity_type
    and vs.duration_seconds>=x.min_duration
    and vs.distance_meters>=x.min_distance
    and (
      (
        se.entity_type='MOVE_VERIFIED_EVENT'
        and se.entity_id=p_move_quest_id
        and se.payload->>'day_key'=p_day_key::text
      )
      or
      (
        se.entity_type='VERIFIED_EVENT'
        and se.entity_id=x.legacy_core_quest
      )
    )
  order by
    case when se.entity_type='MOVE_VERIFIED_EVENT' then 0 else 1 end,
    se.created_at desc
  limit 1
$$;

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
  if p_day_key is null or p_day_key>current_date+1 or p_day_key<current_date-31
    then raise exception 'INVALID_MOVE_DAY'; end if;

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
    and se.processing_status='PROCESSED'
    and vs.verdict='VERIFIED'
    and vs.activity_type=v_activity
    and coalesce(vs.confidence_score,0)>=70
    and coalesce(vs.duration_seconds,0)>=v_duration
    and coalesce(vs.distance_meters,0)>=v_distance
    and (
      (
        se.entity_type='MOVE_VERIFIED_EVENT'
        and se.entity_id=p_move_quest_id
        and se.payload->>'day_key'=p_day_key::text
      )
      or
      (
        se.entity_type='VERIFIED_EVENT'
        and se.entity_id=v_core_quest
      )
    )
  limit 1;
  if not found then raise exception 'MOVE_SERVER_EVIDENCE_REQUIRED'; end if;

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

revoke all on function public.submit_move_verified_event_v3(text,date,integer,numeric,integer,text)
  from public,anon;
grant execute on function public.submit_move_verified_event_v3(text,date,integer,numeric,integer,text)
  to authenticated;
revoke all on function public.get_my_move_verified_source(text,date)
  from public,anon;
grant execute on function public.get_my_move_verified_source(text,date)
  to authenticated;
revoke all on function public.submit_verified_move_contribution(uuid,text,text,date)
  from public,anon;
grant execute on function public.submit_verified_move_contribution(uuid,text,text,date)
  to authenticated;
