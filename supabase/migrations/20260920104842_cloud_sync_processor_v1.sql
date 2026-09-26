-- Server-owned rules. Existing migrations, rewards and local gameplay remain intact.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.sync_events drop constraint sync_events_processing_status_check;
alter table public.sync_events add constraint sync_events_processing_status_check
  check (processing_status in ('RECEIVED','PROCESSING','PROCESSED','REJECTED'));
alter table public.sync_events add column processing_attempted_at timestamptz;
create index sync_events_pending_processor_idx on public.sync_events(user_id, processing_attempted_at nulls first, created_at, id)
  where processing_status = 'RECEIVED';
-- Existing (user_id,event_key), (user_id,claim_key), (user_id,ledger_key) and
-- summary (user_id,event_key) unique constraints remain the final idempotency guards.
alter table public.reward_ledger add column evidence_event_key text;
create unique index reward_ledger_evidence_key_idx on public.reward_ledger(user_id,evidence_event_key)
  where evidence_event_key is not null;

insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values
  ('DAILY_WALK_PROTOCOL_1',80,8,'{"VIT":70}'),
  ('DAILY_RUN_PROTOCOL_1',100,10,'{"VIT":90}'),
  ('DAILY_RIDE_PROTOCOL_1',100,10,'{"VIT":80}'),
  ('DAILY_FOCUS_SESSION',60,5,'{"WIL":60}'),
  ('DAILY_LEARN_SOMETHING',60,5,'{"INT":60}'),
  ('DAILY_CREATE',50,5,'{"CRE":50}'),
  ('DAILY_ORGANIZE',50,5,'{"RES":50}'),
  ('DAILY_CLEAR',75,10,'{}'), ('WEEKLY_COMPLETE',150,15,'{}'),
  ('BOSS_STAGE',0,0,'{}')
on conflict (reward_code) do nothing;

create table private.sync_quest_rules (
  rule_key text primary key,
  reward_code text not null references public.reward_catalog(reward_code),
  verification_type text not null check (verification_type in ('GPS_DISTANCE','TIMER','MULTI','GPS_LOCATION')),
  minimum_score integer not null check (minimum_score between 0 and 100),
  minimum_distance numeric not null default 0,
  minimum_duration numeric not null default 0,
  activity_type text,
  prerequisites text[] not null default '{}',
  evidence_kind text not null default 'DIRECT'
);
alter table private.sync_quest_rules enable row level security;
revoke all on private.sync_quest_rules from public, anon, authenticated;
insert into private.sync_quest_rules values
  ('first_movement_v1','AWAKENING_FIRST_MOVE','GPS_DISTANCE',80,500,1,null,'{}','DIRECT'),
  ('focus_protocol_v1','AWAKENING_FOCUS_PROTOCOL','TIMER',100,0,600,null,'{first_movement_v1}','DIRECT'),
  ('final_trial_v1','AWAKENING_FINAL_TRIAL','MULTI',80,600,600,null,'{first_movement_v1,focus_protocol_v1}','DIRECT'),
  ('daily:walk_protocol_1','DAILY_WALK_PROTOCOL_1','GPS_DISTANCE',70,1500,1,'WALK','{awakening_chapter_1}','DIRECT'),
  ('daily:run_protocol_1','DAILY_RUN_PROTOCOL_1','GPS_DISTANCE',70,1000,1,'RUN','{awakening_chapter_1}','DIRECT'),
  ('daily:ride_protocol_1','DAILY_RIDE_PROTOCOL_1','GPS_DISTANCE',70,3000,1,'BIKE','{awakening_chapter_1}','DIRECT'),
  ('daily:focus_session','DAILY_FOCUS_SESSION','TIMER',100,0,900,null,'{awakening_chapter_1}','DIRECT'),
  ('daily:learn_something','DAILY_LEARN_SOMETHING','TIMER',100,0,1200,null,'{awakening_chapter_1}','DIRECT'),
  ('daily:create','DAILY_CREATE','TIMER',100,0,1200,null,'{awakening_chapter_1}','DIRECT'),
  ('daily:organize','DAILY_ORGANIZE','TIMER',100,0,900,null,'{awakening_chapter_1}','DIRECT'),
  ('wall_focus_v1','BOSS_STAGE','TIMER',100,0,900,null,'{world_link_chapter_2}','DIRECT'),
  ('wall_walk_v1','BOSS_STAGE','GPS_DISTANCE',70,2000,1,'WALK','{wall_focus_v1}','DIRECT'),
  ('wall_run_v1','BOSS_STAGE','GPS_DISTANCE',70,2000,1,'RUN','{wall_focus_v1}','DIRECT'),
  ('awakening_chapter_1','AWAKENING_COMPLETE','MULTI',100,0,0,null,'{first_movement_v1,focus_protocol_v1,final_trial_v1}','DERIVED'),
  ('daily_clear','DAILY_CLEAR','MULTI',100,0,0,null,'{awakening_chapter_1}','DAILY_CLEAR'),
  ('weekly_complete','WEEKLY_COMPLETE','MULTI',100,0,0,null,'{awakening_chapter_1}','WEEKLY_COMPLETE'),
  ('first_world_signal_v1','WORLD_SIGNAL_LOCATED','GPS_LOCATION',80,0,0,null,'{awakening_chapter_1}','WORLD_SIGNAL'),
  ('world_link_chapter_2','WORLD_LINK_COMPLETE','MULTI',100,0,0,null,'{awakening_chapter_1,first_world_signal_v1}','WORLD_LINK'),
  ('extra_mile_v1','EXTRA_MILE_COMPLETE','MULTI',100,0,0,null,'{awakening_chapter_1}','EXTRA_MILE'),
  ('rematch','REMATCH_BONUS','MULTI',100,0,0,null,'{awakening_chapter_1}','COMEBACK'),
  ('no_turning_back_v1','NO_TURNING_BACK_COMPLETE','MULTI',100,0,0,null,'{awakening_chapter_1}','COMEBACK'),
  ('the_first_wall_v1','BOSS_FIRST_WALL_COMPLETE','MULTI',100,0,0,null,'{world_link_chapter_2,wall_focus_v1}','BOSS_COMPLETE');

-- Same formulas as mobile core/progression.ts; parity tested at every rank boundary.
create function private.sync_progress(p_total bigint, p_skill boolean default false)
returns table(level integer, xp bigint) language plpgsql immutable set search_path = '' as $$
declare required bigint;
begin
  if p_total < 0 or p_total > 9007199254740991 then raise exception 'INVALID_TOTAL_XP'; end if;
  level := 1; xp := p_total;
  loop
    required := case when p_skill
      then floor(80 + level * 28 + power(level::double precision,1.6) * 9 + 0.5)::bigint
      else floor(100 + level * 35 + power(level::double precision,1.65) * 12 + 0.5)::bigint end;
    exit when xp < required;
    xp := xp - required; level := level + 1;
    if level > 100000 then raise exception 'INVALID_TOTAL_XP'; end if;
  end loop;
  return next;
end;
$$;
create function private.sync_rank(p_level integer) returns text
language sql immutable set search_path = '' as $$
  select case when p_level >= 300 then 'ASCENDED' when p_level >= 200 then 'SSS'
    when p_level >= 150 then 'SS' when p_level >= 100 then 'S' when p_level >= 70 then 'A'
    when p_level >= 45 then 'B' when p_level >= 25 then 'C' when p_level >= 10 then 'D' else 'E' end;
$$;

create function private.process_verified_sync_event(p_id uuid, p_user uuid) returns text
language plpgsql set search_path = '' as $$
declare
  e public.sync_events%rowtype;
  r private.sync_quest_rules%rowtype;
  reward public.reward_catalog%rowtype;
  q text; v_rule_key text; reason text; v_claim_key text; claimed uuid;
  score numeric; distance numeric := 0; duration numeric := 0;
  day date; parts text[]; total bigint; progress record; skill record;
begin
  -- Every entry point locks the user before any event/progression row. Same-user
  -- batches and single-event calls therefore have the same deadlock-free order.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 41901));
  select * into e from public.sync_events where id=p_id and user_id=p_user for update;
  if not found then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
  if e.processing_status in ('PROCESSED','REJECTED') then return e.processing_status; end if;
  begin
    update public.sync_events set processing_status='PROCESSING',processing_attempted_at=clock_timestamp(),rejection_reason=null where id=e.id;
    q := e.payload->>'quest_id'; v_rule_key := q;
    if e.entity_type <> 'VERIFIED_EVENT' then reason := 'UNSUPPORTED_EVENT';
    elsif jsonb_typeof(e.payload) is distinct from 'object' or e.schema_version <> 1
      or e.event_key !~ '^[A-Za-z0-9._:-]{1,180}$'
      or jsonb_typeof(e.payload->'quest_id') is distinct from 'string'
      or length(q) not between 1 and 180 or e.entity_id is distinct from q
      or (e.payload ? 'user_id' and e.payload->>'user_id' is distinct from p_user::text)
      or jsonb_typeof(e.payload->'verification_score') is distinct from 'number'
      or jsonb_typeof(e.payload->'verification_type') is distinct from 'string'
      then reason := 'INVALID_PAYLOAD';
    else
      score := (e.payload->>'verification_score')::numeric;
      if e.payload ? 'distance_meters' then
        if jsonb_typeof(e.payload->'distance_meters') is distinct from 'number' then reason := 'INVALID_PAYLOAD';
        else distance := (e.payload->>'distance_meters')::numeric; end if;
      end if;
      if e.payload ? 'duration_seconds' then
        if jsonb_typeof(e.payload->'duration_seconds') is distinct from 'number' then reason := 'INVALID_PAYLOAD';
        else duration := (e.payload->>'duration_seconds')::numeric; end if;
      end if;
      if distance not between 0 and 500000 or duration not between 0 and 172800 then reason := 'INVALID_PAYLOAD'; end if;
      if score not between 0 and 100 then reason := 'INVALID_VERIFICATION'; end if;
      if q like 'daily:%' then
        parts := regexp_match(q, '^daily:([0-9]{4}-[0-9]{2}-[0-9]{2}):([a-z0-9_]+)$');
        if parts is null then reason := 'UNKNOWN_QUEST';
        else
          begin day := parts[1]::date; exception when others then reason := 'INVALID_PAYLOAD'; end;
          -- Offline delivery may be late. The server receive date bounds future
          -- claims; client_created_at cannot make a future Daily eligible.
          if day < date '2026-09-18' or day > (e.created_at at time zone 'UTC')::date + 1 then reason := 'INVALID_PAYLOAD'; end if;
          v_rule_key := 'daily:' || parts[2];
        end if;
      elsif q ~ '^daily_clear:[0-9]{4}-[0-9]{2}-[0-9]{2}$' then v_rule_key := 'daily_clear';
      elsif q ~ '^weekly_complete:[0-9]{4}-W[0-9]{2}$' then v_rule_key := 'weekly_complete';
      elsif q like 'rematch:%' then v_rule_key := 'rematch'; end if;
      if v_rule_key='daily_clear' then
        begin
          day := substring(q from 13)::date;
          if day < date '2026-09-18' or day > (e.created_at at time zone 'UTC')::date+1 then reason := 'INVALID_PAYLOAD'; end if;
        exception when others then reason := 'INVALID_PAYLOAD'; end;
      elsif v_rule_key='weekly_complete' then
        begin
          day := to_date(substring(q from 17)||'-1','IYYY-"W"IW-ID');
          if to_char(day,'IYYY-"W"IW') <> substring(q from 17)
            or day < date '2026-09-14' or day > (e.created_at at time zone 'UTC')::date+1 then reason := 'INVALID_PAYLOAD'; end if;
        exception when others then reason := 'INVALID_PAYLOAD'; end;
      end if;
      select * into r from private.sync_quest_rules rules where rules.rule_key=v_rule_key;
      if not found then reason := coalesce(reason,'UNKNOWN_QUEST');
      elsif reason is null then
        if e.payload->>'verification_type' <> r.verification_type or score < r.minimum_score
          or score <> trunc(score) then reason := 'INVALID_VERIFICATION';
        elsif distance < r.minimum_distance then reason := 'BELOW_DISTANCE';
        elsif duration < r.minimum_duration then reason := 'BELOW_DURATION';
        elsif r.minimum_distance > 0 and distance / greatest(duration,1) >
          (case when r.activity_type='BIKE' then 25 when r.activity_type='RUN' then 12
            when r.activity_type='WALK' then 7 else 8.5 end)
          then reason := 'INVALID_VERIFICATION';
        elsif r.activity_type is not null and (jsonb_typeof(e.payload->'activity') is distinct from 'object'
          or e.payload#>>'{activity,expected}' is distinct from r.activity_type
          or e.payload#>>'{activity,detected}' is distinct from r.activity_type
          or e.payload#>>'{activity,verdict}' is distinct from 'VERIFIED') then reason := 'INVALID_VERIFICATION';
        end if;
      end if;
    end if;

    if reason is null and exists (
      select 1 from unnest(r.prerequisites) needed where not exists (
        select 1 from public.reward_ledger l where l.user_id=p_user and l.source_type='VERIFIED_EVENT' and l.source_id=needed
      )
    ) then
      -- Arrival order is not proof of cheating. Revisit after prerequisite sync.
      update public.sync_events set processing_status='RECEIVED',rejection_reason='MISSING_PREREQUISITE' where id=e.id;
      return 'RECEIVED';
    end if;

    -- Same daily slot limits as mobile generateDaily; local preference/seed IDs
    -- are not cloud identities, so only the allowed template and slot budget is
    -- authoritative here. A new event key cannot create a fourth daily reward.
    if reason is null and q like 'daily:%' and not exists (
      select 1 from public.reward_ledger l where l.user_id=p_user and l.ledger_key='sync-quest:'||q
    ) and ((select count(*) from public.quest_completions c where c.user_id=p_user
      and c.quest_id like 'daily:'||day::text||':%') >= 3
      or (r.activity_type is not null and exists (
        select 1 from public.quest_completions c join private.sync_quest_rules rules
          on rules.rule_key='daily:'||split_part(c.quest_id,':',3)
        where c.user_id=p_user and c.quest_id like 'daily:'||day::text||':%' and rules.activity_type is not null
      ))) then reason := 'DAILY_LIMIT'; end if;

    -- Derived rewards require existing server-owned evidence, never a client's
    -- claimed completion, reward code or XP. Unsupported evidence fails closed.
    if reason is null then
      if r.evidence_kind='DAILY_CLEAR' and (select count(*) from public.quest_completions c
        where c.user_id=p_user and c.quest_id like 'daily:'||substring(q from 13)||':%') < 3 then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='WEEKLY_COMPLETE' and (select count(*) from public.quest_completions c
        where c.user_id=p_user and c.quest_id ~ '^daily:[0-9]{4}-[0-9]{2}-[0-9]{2}:'
          and to_char(substring(c.quest_id from 7 for 10)::date,'IYYY-"W"IW')=substring(q from 17)) < 5 then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='WORLD_SIGNAL' and not exists (select 1 from public.world_signals w
        where w.user_id=p_user and w.signal_id=q and w.status='LOCATED') then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='WORLD_LINK' and ((select count(*) from public.world_sectors w where w.user_id=p_user)<3
        or not exists(select 1 from public.reward_ledger l where l.user_id=p_user and l.reward_code='DAILY_CLEAR')) then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='EXTRA_MILE' and not exists (
        select 1 from public.verification_summaries v join public.sync_events se on se.user_id=v.user_id and se.event_key=v.event_key
        join private.sync_quest_rules rules on rules.rule_key='daily:'||split_part(se.entity_id,':',3)
        where v.user_id=p_user and v.verdict='VERIFIED' and rules.minimum_distance>0 and v.distance_meters>=rules.minimum_distance*1.25
      ) then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='COMEBACK' then reason := 'UNSUPPORTED_EVENT';
      elsif r.evidence_kind='BOSS_COMPLETE' and not exists (
        select 1 from public.boss_progress b where b.user_id=p_user and b.boss_id=q and b.status='COMPLETED'
      ) then reason := 'MISSING_PREREQUISITE';
      end if;
    end if;
    if reason = 'MISSING_PREREQUISITE' then
      update public.sync_events set processing_status='RECEIVED',rejection_reason=reason where id=e.id;
      return 'RECEIVED';
    end if;
    if reason is not null then
      update public.sync_events set processing_status='REJECTED',rejection_reason=reason,processed_at=now() where id=e.id;
      return 'REJECTED';
    end if;

    select * into strict reward from public.reward_catalog where reward_code=r.reward_code and active;
    v_claim_key := 'sync-quest:' || q;
    -- Canonical quest IDs deduplicate alternate event keys/devices as well.
    if exists(select 1 from public.reward_ledger l where l.user_id=p_user and (l.ledger_key=v_claim_key or l.evidence_event_key=e.event_key or (l.source_id=q and l.reward_code=r.reward_code))) then
      update public.sync_events set processing_status='REJECTED',rejection_reason='DUPLICATE',processed_at=now() where id=e.id;
      return 'REJECTED';
    end if;
    insert into public.reward_claims(user_id,claim_key,reward_code,source_type,source_id,evidence_event_key,status,processed_at)
      values(p_user,v_claim_key,r.reward_code,'VERIFIED_EVENT',q,e.event_key,'APPROVED',now())
      on conflict(user_id,claim_key) do update set reward_code=excluded.reward_code,
        source_type=excluded.source_type,source_id=excluded.source_id,evidence_event_key=excluded.evidence_event_key,
        status='APPROVED',processed_at=excluded.processed_at,rejection_reason=null
        where public.reward_claims.status='PENDING'
      returning id into claimed;
    if claimed is null then raise exception 'CLAIM_CONFLICT'; end if;
    insert into public.reward_ledger(user_id,ledger_key,reward_code,real_xp,energy,skill_rewards,title_key,source_type,source_id,evidence_event_key)
      values(p_user,v_claim_key,r.reward_code,reward.real_xp,reward.energy,reward.skill_rewards,reward.title_key,'VERIFIED_EVENT',q,e.event_key);
    select real_total_xp + reward.real_xp into strict total from public.player_progress where user_id=p_user for update;
    select * into progress from private.sync_progress(total);
    update public.player_progress set real_total_xp=total,real_level=progress.level,real_xp=progress.xp,
      rank=private.sync_rank(progress.level),energy=energy+reward.energy,
      evolution_stage=case when progress.level>=25 then 2 when progress.level>=10 then 1 else 0 end,
      revision=revision+1,updated_at=now() where user_id=p_user;
    for skill in select key,value from jsonb_each(reward.skill_rewards) loop
      if skill.key not in ('STR','VIT','INT','WIL','CHA','CRE','RES') or jsonb_typeof(skill.value)<>'number'
        or skill.value::text::numeric not between 0 and 100000 or skill.value::text::numeric<>trunc(skill.value::text::numeric) then
        raise exception 'INVALID_SERVER_REWARD';
      end if;
      insert into public.skill_progress(user_id,skill_key) values(p_user,skill.key) on conflict do nothing;
      select total_xp + skill.value::text::bigint into total from public.skill_progress where user_id=p_user and skill_key=skill.key for update;
      select * into progress from private.sync_progress(total,true);
      update public.skill_progress set total_xp=total,level=progress.level,xp=progress.xp,revision=revision+1,updated_at=now()
        where user_id=p_user and skill_key=skill.key;
    end loop;
    insert into public.verification_summaries(user_id,event_key,activity_type,verdict,confidence_score,distance_meters,duration_seconds,reason_codes)
      values(p_user,e.event_key,r.activity_type,'VERIFIED',score::integer,floor(distance)::integer,floor(duration)::integer,'[]');
    insert into public.quest_completions(user_id,completion_key,quest_id,quest_instance_id,reward_fingerprint)
      values(p_user,v_claim_key,q,q,r.reward_code) on conflict(user_id,completion_key) do nothing;
    if reward.title_key is not null then
      insert into public.title_unlocks(user_id,title_key,source_type,source_id) values(p_user,reward.title_key,'VERIFIED_EVENT',q) on conflict do nothing;
    end if;
    update public.sync_events set processing_status='PROCESSED',processed_at=now(),rejection_reason=null where id=e.id;
    return 'PROCESSED';
  exception when others then
    -- This exception block is a savepoint: no partial claim/ledger/progression.
    -- Never expose SQLERRM, stack traces or privileged details to the client.
    update public.sync_events set processing_status='RECEIVED',processed_at=null,processing_attempted_at=clock_timestamp(),rejection_reason='PROCESSING_ERROR' where id=e.id;
    return 'RECEIVED';
  end;
end;
$$;

create function public.process_sync_event(p_event_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
  return private.process_verified_sync_event(p_event_id,u);
end;
$$;

create function public.process_pending_sync_events(p_limit integer default 25) returns integer
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); e record; n integer := 0;
begin
  if u is null then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,41901));
  for e in select id from public.sync_events where user_id=u and processing_status='RECEIVED'
    order by processing_attempted_at nulls first,created_at,id limit greatest(1,least(coalesce(p_limit,25),100)) for update skip locked loop
    perform private.process_verified_sync_event(e.id,u); n:=n+1;
  end loop;
  return n;
end;
$$;

create or replace function public.submit_sync_event(
  p_event_key text,p_entity_type text,p_entity_id text default null,p_payload jsonb default '{}',
  p_device_install_id text default null,p_client_created_at timestamptz default null,p_schema_version integer default 1
) returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); event_id uuid; body jsonb;
begin
  if u is null then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
  if p_event_key is null or p_event_key !~ '^[A-Za-z0-9._:-]{1,180}$' then raise exception 'INVALID_EVENT_KEY'; end if;
  if p_entity_type is null or p_entity_type !~ '^[A-Za-z0-9._:-]{1,100}$' then raise exception 'INVALID_ENTITY_TYPE'; end if;
  if p_schema_version is null or p_schema_version not between 1 and 999 then raise exception 'INVALID_SCHEMA_VERSION'; end if;
  if octet_length(coalesce(p_payload,'{}')::text)>16384 then raise exception 'PAYLOAD_TOO_LARGE'; end if;
  if p_payload::text ~* '"(lat|lng|latitude|longitude|route|gps|photo|image)"[[:space:]]*:' then raise exception 'SENSITIVE_FIELD_REJECTED'; end if;
  -- Keep aggregate evidence only. Client rewards and arbitrary nested metadata
  -- are never persisted or forwarded to the authoritative reward calculation.
  body := p_payload;
  if jsonb_typeof(p_payload)='object' then
    body := jsonb_strip_nulls(jsonb_build_object('quest_id',p_payload->'quest_id',
      'verification_type',p_payload->'verification_type','verification_score',p_payload->'verification_score',
      'distance_meters',p_payload->'distance_meters','duration_seconds',p_payload->'duration_seconds','user_id',p_payload->'user_id'));
    if p_payload ? 'activity' then body := body || jsonb_build_object('activity',jsonb_build_object(
      'expected',p_payload#>'{activity,expected}','detected',p_payload#>'{activity,detected}','verdict',p_payload#>'{activity,verdict}')); end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,41901));
  insert into public.sync_events(user_id,event_key,entity_type,entity_id,payload,device_install_id,client_created_at,schema_version)
    values(u,p_event_key,p_entity_type,left(p_entity_id,180),coalesce(body,'null'::jsonb),left(p_device_install_id,180),p_client_created_at,p_schema_version)
    on conflict(user_id,event_key) do nothing returning id into event_id;
  if event_id is null then select id into event_id from public.sync_events where user_id=u and event_key=p_event_key; end if;
  perform private.process_verified_sync_event(event_id,u);
  return event_id;
end;
$$;

revoke all on function private.sync_progress(bigint,boolean),private.sync_rank(integer),private.process_verified_sync_event(uuid,uuid) from public,anon,authenticated;
revoke all on function public.process_sync_event(uuid),public.process_pending_sync_events(integer),public.submit_sync_event(text,text,text,jsonb,text,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.process_sync_event(uuid),public.process_pending_sync_events(integer),public.submit_sync_event(text,text,text,jsonb,text,timestamptz,integer) to authenticated;
-- RPC is the only ingress. Clients cannot reserve claim keys or forge receive
-- times/statuses. Existing SELECT policies and get_sync_status remain unchanged.
revoke insert,update,delete on public.sync_events,public.reward_claims from anon,authenticated;
revoke insert,update,delete on public.reward_ledger,public.player_progress,public.skill_progress,public.verification_summaries from anon,authenticated;
