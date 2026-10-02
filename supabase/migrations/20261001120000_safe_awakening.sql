-- Safe indoor Awakening alternatives. Rewards remain server-owned and stages are shared.
create or replace function private.awakening_stage(q text) returns integer
language sql immutable set search_path='' as $$
 select case q when 'first_movement_v1' then 1 when 'awakening_observe_v1' then 1
 when 'focus_protocol_v1' then 2 when 'awakening_imagine_v1' then 2
 when 'final_trial_v1' then 3 when 'awakening_plan_v1' then 3 else null end
$$;
revoke all on function private.awakening_stage(text) from public,anon,authenticated;
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values
 ('AWAKENING_SAFE_OBSERVE',50,5,'{"WIL":40}'),
 ('AWAKENING_SAFE_IMAGINE',50,5,'{"CRE":40}'),
 ('AWAKENING_SAFE_PLAN',50,5,'{"INT":40}');
insert into private.sync_quest_rules values
 ('awakening_observe_v1','AWAKENING_SAFE_OBSERVE','TIMER',100,0,300,null,'{}','DIRECT'),
 ('awakening_imagine_v1','AWAKENING_SAFE_IMAGINE','TIMER',100,0,300,null,'{first_movement_v1}','DIRECT'),
 ('awakening_plan_v1','AWAKENING_SAFE_PLAN','TIMER',100,0,300,null,'{first_movement_v1,focus_protocol_v1}','DIRECT');

-- a2 proportional XP; a1 rewards, evidence checks, ownership, locks and claims remain unchanged.
create or replace function private.process_verified_sync_event(p_id uuid, p_user uuid) returns text
language plpgsql set search_path = '' as $$
declare
  e public.sync_events%rowtype;
  r private.sync_quest_rules%rowtype;
  reward public.reward_catalog%rowtype;
  q text; v_rule_key text; reason text; v_claim_key text; claimed uuid;
  score numeric; distance numeric := 0; duration numeric := 0;
  day date; parts text[]; total bigint; progress record; skill record;
  adaptive boolean := false; plan jsonb; stored_plan jsonb; target integer; slots integer := 3;
  weekly_target integer; boss_difficulty integer; stored_boss integer; canonical_daily text; base_target numeric;
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
        parts := regexp_match(q, '^daily:([0-9]{4}-[0-9]{2}-[0-9]{2}):([a-z0-9_]+)(?::a[12]:([1-5]):([1-9][0-9]{0,4}))?$');
        if parts is null then reason := 'UNKNOWN_QUEST';
        else
          begin day := parts[1]::date; exception when others then reason := 'INVALID_PAYLOAD'; end;
          -- Offline delivery may be late. The server receive date bounds future
          -- claims; client_created_at cannot make a future Daily eligible.
          if day < date '2026-09-18' or day > (e.created_at at time zone 'UTC')::date + 1 then reason := 'INVALID_PAYLOAD'; end if;
          v_rule_key := 'daily:' || parts[2];
          adaptive := parts[3] is not null;
          if adaptive then
            plan := e.payload->'adaptive';
            if not exists(select 1 from private.sync_quest_rules rules where rules.rule_key=v_rule_key) then reason := 'UNKNOWN_QUEST';
            elsif plan is null and reason is null then
              update public.sync_events set processing_status='RECEIVED',rejection_reason='ADAPTIVE_CONTEXT_REQUIRED' where id=e.id;
              return 'RECEIVED';
            elsif not private.valid_adaptive_sync_plan(plan) then reason := 'INVALID_ADAPTIVE_PLAN';
            elsif (plan->>'difficulty')::integer <> parts[3]::integer then reason := 'INVALID_ADAPTIVE_TARGET';
            end if;
          elsif e.payload ? 'adaptive' then reason := 'INVALID_ADAPTIVE_PLAN'; end if;
        end if;
      elsif q ~ '^daily_clear:[0-9]{4}-[0-9]{2}-[0-9]{2}$' then v_rule_key := 'daily_clear';
      elsif q ~ '^weekly_complete:[0-9]{4}-W[0-9]{2}$' then v_rule_key := 'weekly_complete';
      elsif q like 'progression:%' then
        parts := regexp_match(q,'^progression:[A-Za-z0-9._:-]+:(weekly:[0-9]{4}-W[0-9]{2}:weekly_(quest_master|daily_consistency|pathfinder|streak_keeper)|milestone:(3|7|14|30))$');
        if parts is null then reason := 'UNKNOWN_QUEST';
        else
          -- Normalize away the local profile ID; auth.uid owns the claim.
          q := 'progression:'||parts[1];
          if split_part(q,':',2)='weekly' then
            v_rule_key := 'progression:'||split_part(q,':',4);
            begin
              day := to_date(split_part(q,':',3)||'-1','IYYY-"W"IW-ID');
              if to_char(day,'IYYY-"W"IW')<>split_part(q,':',3) or day>(e.created_at at time zone 'UTC')::date+1 then reason:='INVALID_PAYLOAD'; end if;
            exception when others then reason:='INVALID_PAYLOAD'; end;
          else v_rule_key := 'progression:milestone_'||split_part(q,':',3); end if;
        end if;
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
        if adaptive then
          slots := (plan->>'daily_count')::integer;
          if (plan->>'difficulty')::integer=1 and v_rule_key like 'daily:g1_%' and v_rule_key !~ '_easy$'
            then reason := 'INVALID_ADAPTIVE_PLAN'; end if;
          base_target := case when r.verification_type='TIMER' then r.minimum_duration else r.minimum_distance end;
          target := floor(least(case when r.verification_type='TIMER' then r.minimum_duration else r.minimum_distance end *
            case when v_rule_key not like 'daily:g1_%' then (array[0.5,1,1.25,1.5,1.75])[(plan->>'difficulty')::integer] else 1 end,
            floor((plan->>'available_minutes')::numeric*60/slots) *
            case when r.verification_type='TIMER' then 1 when r.activity_type='BIKE' then 4 when r.activity_type='RUN' then 2.5 else 1.25 end));
          if target<>parts[4]::integer then reason := 'INVALID_ADAPTIVE_TARGET';
          elsif r.verification_type='TIMER' then r.minimum_duration := target;
          else r.minimum_distance := target; end if;
          select d.plan into stored_plan from private.adaptive_sync_days d where d.user_id=p_user and d.day_key=day;
          if stored_plan is not null and stored_plan<>plan then reason := 'ADAPTIVE_PLAN_CONFLICT'; end if;
          if stored_plan is null and exists(select 1 from public.quest_completions c where c.user_id=p_user and c.quest_id like 'daily:'||day::text||':%')
            then reason := 'ADAPTIVE_PLAN_CONFLICT'; end if;
          select w.target into weekly_target from private.adaptive_sync_weeks w where w.user_id=p_user and w.week_key=to_char(day,'IYYY-"W"IW');
          if weekly_target is not null and weekly_target<>(plan->>'weekly_target')::integer then reason := 'ADAPTIVE_PLAN_CONFLICT'; end if;
          if weekly_target is null and (plan->>'weekly_target')::integer<>5 and exists(
            select 1 from public.quest_completions c where c.user_id=p_user and c.quest_id ~ '^daily:[0-9]{4}-[0-9]{2}-[0-9]{2}:'
            and to_char(substring(c.quest_id from 7 for 10)::date,'IYYY-"W"IW')=to_char(day,'IYYY-"W"IW')) then reason := 'ADAPTIVE_PLAN_CONFLICT'; end if;
          -- The fourth slot is earned by recent accepted activity, never by a
          -- client asserting an effortless history. Missing offline history can retry.
          if slots=4 and reason is null and (select count(*) from public.verification_summaries v
            join public.sync_events se on se.user_id=v.user_id and se.event_key=v.event_key
            join private.sync_quest_rules rules on rules.rule_key=case when se.entity_id like 'daily:%' then 'daily:'||split_part(se.entity_id,':',3) else se.entity_id end
            where v.user_id=p_user and v.verdict='VERIFIED' and rules.evidence_kind='DIRECT'
            and case when se.entity_id like 'daily:%' then substring(se.entity_id from 7 for 10)::date
              else coalesce((se.payload->>'completed_day')::date,(coalesce(se.client_created_at,se.created_at) at time zone 'UTC')::date) end between day-7 and day)<5
            then reason := 'MISSING_PREREQUISITE'; end if;
        elsif q in ('wall_focus_v1','wall_walk_v1','wall_run_v1') then
          boss_difficulty := 2;
          if e.payload ? 'adaptive_boss_difficulty' then
            if jsonb_typeof(e.payload->'adaptive_boss_difficulty')<>'number' or (e.payload->>'adaptive_boss_difficulty') !~ '^[1-5]$' then reason := 'INVALID_ADAPTIVE_PLAN';
            else boss_difficulty := (e.payload->>'adaptive_boss_difficulty')::integer; end if;
          end if;
          select b.difficulty into stored_boss from private.adaptive_sync_boss b where b.user_id=p_user;
          if stored_boss is not null and stored_boss<>boss_difficulty then reason := 'ADAPTIVE_PLAN_CONFLICT'; end if;
          if q='wall_focus_v1' then r.minimum_duration := 300+boss_difficulty*300;
          else r.minimum_distance := boss_difficulty*1000; end if;
        elsif e.payload ? 'adaptive' or e.payload ? 'adaptive_boss_difficulty' then reason := 'INVALID_ADAPTIVE_PLAN'; end if;
        if reason is not null then null;
        elsif e.payload->>'verification_type' <> r.verification_type or score < r.minimum_score
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
        select 1 from public.reward_ledger l where l.user_id=p_user and l.source_type='VERIFIED_EVENT' and (l.source_id=needed or private.awakening_stage(l.source_id)=private.awakening_stage(needed))
      )
    ) then
      -- Arrival order is not proof of cheating. Revisit after prerequisite sync.
      update public.sync_events set processing_status='RECEIVED',rejection_reason='MISSING_PREREQUISITE' where id=e.id;
      return 'RECEIVED';
    end if;

    if reason is null and r.minimum_level>(select real_level from public.player_progress where user_id=p_user) then
      update public.sync_events set processing_status='RECEIVED',rejection_reason='MISSING_PREREQUISITE' where id=e.id;
      return 'RECEIVED';
    end if;
    if reason is null and r.evidence_kind='PROGRESSION' and not private.sync_progression_eligible(p_user,q) then
      update public.sync_events set processing_status='RECEIVED',rejection_reason='MISSING_PREREQUISITE' where id=e.id;
      return 'RECEIVED';
    end if;

    -- Local calendar attribution is bounded by the accepted completion timestamp.
    -- Older clients omit this field and retain the documented UTC fallback.
    if reason is null and r.evidence_kind='DIRECT' and e.payload ? 'completed_day' then
      begin
        if jsonb_typeof(e.payload->'completed_day')<>'string' or (e.payload->>'completed_day') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
          or abs((e.payload->>'completed_day')::date - (coalesce(e.client_created_at,e.created_at) at time zone 'UTC')::date)>1
          or (e.payload->>'completed_day')::date>(e.created_at at time zone 'UTC')::date+1
          or (e.payload->>'completed_day')::date<date '2026-09-18'
          or e.client_created_at>e.created_at+interval '1 day'
        then reason:='INVALID_PAYLOAD'; end if;
      exception when others then reason:='INVALID_PAYLOAD'; end;
    end if;

    if reason is null and q like 'daily:%' then
      canonical_daily := private.sync_daily_identity(q);
      if exists(select 1 from public.quest_completions c where c.user_id=p_user and private.sync_daily_identity(c.quest_id)=canonical_daily)
        then reason := 'DUPLICATE'; end if;
      if not adaptive then
        select coalesce((d.plan->>'daily_count')::integer,3) into slots from private.adaptive_sync_days d where d.user_id=p_user and d.day_key=day;
        slots := coalesce(slots,3);
      end if;
    end if;

    -- Legacy days retain three slots. Adaptive days use the frozen, validated
    -- workload budget. A new event key cannot create an additional daily reward.
    if reason is null and q like 'daily:%' and not exists (
      select 1 from public.reward_ledger l where l.user_id=p_user and l.ledger_key='sync-quest:'||q
    ) and ((select count(*) from public.quest_completions c where c.user_id=p_user
      and c.quest_id like 'daily:'||day::text||':%') >= slots
      or (r.activity_type is not null and r.rule_key not like 'daily:g1_%' and exists (
        select 1 from public.quest_completions c join private.sync_quest_rules rules
          on rules.rule_key='daily:'||split_part(c.quest_id,':',3)
        where c.user_id=p_user and c.quest_id like 'daily:'||day::text||':%' and rules.activity_type is not null
      ))) then reason := 'DAILY_LIMIT'; end if;

    -- Derived rewards require existing server-owned evidence, never a client's
    -- claimed completion, reward code or XP. Unsupported evidence fails closed.
    if reason is null then
      if r.evidence_kind='DAILY_CLEAR' and (select count(*) from public.quest_completions c
        where c.user_id=p_user and c.quest_id like 'daily:'||substring(q from 13)||':%') < coalesce((select (d.plan->>'daily_count')::integer from private.adaptive_sync_days d where d.user_id=p_user and d.day_key=day),3) then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='WEEKLY_COMPLETE' and (select count(*) from public.quest_completions c
        where c.user_id=p_user and c.quest_id ~ '^daily:[0-9]{4}-[0-9]{2}-[0-9]{2}:'
          and to_char(substring(c.quest_id from 7 for 10)::date,'IYYY-"W"IW')=substring(q from 17)) < coalesce((select w.target from private.adaptive_sync_weeks w where w.user_id=p_user and w.week_key=substring(q from 17)),5) then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='WORLD_SIGNAL' and not exists (select 1 from public.world_signals w
        where w.user_id=p_user and w.signal_id=q and w.status='LOCATED') then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='WORLD_LINK' and ((select count(*) from public.world_sectors w where w.user_id=p_user)<3
        or not exists(select 1 from public.reward_ledger l where l.user_id=p_user and l.reward_code='DAILY_CLEAR')) then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='EXTRA_MILE' and not exists (
        select 1 from public.verification_summaries v join public.sync_events se on se.user_id=v.user_id and se.event_key=v.event_key
        join private.sync_quest_rules rules on rules.rule_key='daily:'||split_part(se.entity_id,':',3)
        where v.user_id=p_user and v.verdict='VERIFIED' and rules.minimum_distance>0 and v.distance_meters>=coalesce(case when se.entity_id ~ ':a[12]:[1-5]:[1-9][0-9]{0,4}$' then split_part(se.entity_id,':',6)::numeric end,rules.minimum_distance)*1.25
      ) then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='COMEBACK' then reason := 'UNSUPPORTED_EVENT';
      elsif r.evidence_kind='BOSS_COMPLETE' and not exists (
        select 1 from public.boss_progress b where b.user_id=p_user and b.boss_id=q and b.status='COMPLETED'
        union all select 1 from public.quest_completions c join public.sync_events move on move.user_id=c.user_id and move.entity_id=c.quest_id and move.processing_status='PROCESSED'
        where c.user_id=p_user and c.quest_id in ('wall_walk_v1','wall_run_v1') and exists(
          select 1 from public.quest_completions daily where daily.user_id=p_user and daily.quest_id ~ '^daily:[0-9]{4}-[0-9]{2}-[0-9]{2}:'
          and substring(daily.quest_id from 7 for 10)::date > coalesce((move.payload->>'completed_day')::date,(coalesce(move.client_created_at,move.created_at) at time zone 'UTC')::date))
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
    -- Versioned reward contract: only new a2 quests scale XP. Never rewrite a1 history.
    if adaptive and q ~ ':a2:[1-5]:[1-9][0-9]{0,4}$' then
      reward.real_xp := case when reward.real_xp=0 then 0 else greatest(1,floor(reward.real_xp*least(target,base_target)/base_target)) end;
      select coalesce(jsonb_object_agg(key,case when value::text::numeric=0 then 0 else greatest(1,floor(value::text::numeric*least(target,base_target)/base_target)) end),'{}'::jsonb)
        into reward.skill_rewards from jsonb_each(reward.skill_rewards);
    end if;
    v_claim_key := 'sync-quest:' || q;
    -- Canonical quest IDs deduplicate alternate event keys/devices as well.
    if exists(select 1 from public.reward_ledger l where l.user_id=p_user and (l.ledger_key=v_claim_key or l.evidence_event_key=e.event_key or (l.source_id=q and l.reward_code=r.reward_code) or (l.source_type='VERIFIED_EVENT' and private.awakening_stage(l.source_id)=private.awakening_stage(q)))) then
      update public.sync_events set processing_status='REJECTED',rejection_reason='DUPLICATE',processed_at=now() where id=e.id;
      return 'REJECTED';
    end if;
    if adaptive then
      insert into private.adaptive_sync_days(user_id,day_key,plan) values(p_user,day,plan) on conflict do nothing;
      insert into private.adaptive_sync_weeks(user_id,week_key,target) values(p_user,to_char(day,'IYYY-"W"IW'),(plan->>'weekly_target')::integer) on conflict do nothing;
    elsif boss_difficulty is not null then
      insert into private.adaptive_sync_boss(user_id,difficulty) values(p_user,boss_difficulty) on conflict do nothing;
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
      'distance_meters',p_payload->'distance_meters','duration_seconds',p_payload->'duration_seconds','completed_day',p_payload->'completed_day','user_id',p_payload->'user_id','adaptive_boss_difficulty',p_payload->'adaptive_boss_difficulty'));
    if p_payload ? 'adaptive' then
      body := body || jsonb_build_object('adaptive',case when jsonb_typeof(p_payload->'adaptive')='object' then
        jsonb_build_object('version',p_payload#>'{adaptive,version}','available_minutes',p_payload#>'{adaptive,available_minutes}',
          'daily_count',p_payload#>'{adaptive,daily_count}','difficulty',p_payload#>'{adaptive,difficulty}','weekly_target',p_payload#>'{adaptive,weekly_target}')
        else p_payload->'adaptive' end);
    end if;
    if p_payload ? 'activity' then body := body || jsonb_build_object('activity',jsonb_build_object(
      'expected',p_payload#>'{activity,expected}','detected',p_payload#>'{activity,detected}','verdict',p_payload#>'{activity,verdict}')); end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,41901));
  insert into public.sync_events(user_id,event_key,entity_type,entity_id,payload,device_install_id,client_created_at,schema_version)
    values(u,p_event_key,p_entity_type,left(p_entity_id,180),coalesce(body,'null'::jsonb),left(p_device_install_id,180),p_client_created_at,p_schema_version)
    on conflict(user_id,event_key) do nothing returning id into event_id;
  if event_id is null then select id into event_id from public.sync_events where user_id=u and event_key=p_event_key; end if;
  -- A pre-upgrade event may be missing ONLY adaptive context. Never replace
  -- evidence, accepted events, ownership, timestamps or rewards on a retry.
  update public.sync_events se set payload=body,processing_status='RECEIVED',rejection_reason=null,processed_at=null
    where se.id=event_id and se.user_id=u and not(se.payload ? 'adaptive') and body ? 'adaptive'
      and se.payload=body-'adaptive' and se.processing_status in ('RECEIVED','REJECTED')
      and se.rejection_reason in ('UNKNOWN_QUEST','ADAPTIVE_CONTEXT_REQUIRED')
      and se.entity_id=p_entity_id and se.schema_version=p_schema_version
      and se.entity_id ~ ':a[12]:[1-5]:[1-9][0-9]{0,4}$'
      and not exists(select 1 from public.reward_ledger l where l.user_id=u and l.evidence_event_key=p_event_key);
  update public.sync_events se set payload=body,processing_status='RECEIVED',rejection_reason=null,processed_at=null
    where se.id=event_id and se.user_id=u and not(se.payload ? 'adaptive_boss_difficulty') and body ? 'adaptive_boss_difficulty'
      and se.payload=body-'adaptive_boss_difficulty' and se.processing_status in ('RECEIVED','REJECTED')
      and se.rejection_reason in ('BELOW_DURATION','BELOW_DISTANCE','MISSING_PREREQUISITE')
      and se.entity_id=p_entity_id and se.schema_version=p_schema_version
      and se.entity_id in ('wall_focus_v1','wall_walk_v1','wall_run_v1')
      and not exists(select 1 from public.reward_ledger l where l.user_id=u and l.evidence_event_key=p_event_key);
  perform private.process_verified_sync_event(event_id,u);
  return event_id;
end;
$$;
