-- Harden Sponsor Challenges against high-value reward claims from MOVE v3 aggregate evidence.
-- MOVE_VERIFIED_EVENT is server-filtered but not cryptographic device attestation.

create or replace function public.route_verification_to_sponsor_challenges()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare
 c record;
 v_delta numeric;
 v_inserted integer;
 v_total numeric;
 v_move_v3 boolean;
begin
 if new.verdict<>'VERIFIED' then return new; end if;

 select exists(
   select 1
   from public.sync_events se
   where se.user_id=new.user_id
     and se.event_key=new.event_key
     and se.entity_type='MOVE_VERIFIED_EVENT'
     and se.processing_status='PROCESSED'
 ) into v_move_v3;

 for c in
   select ch.*,p.verified_value
   from public.sponsor_challenges_v2 ch
   join public.sponsor_participation_v2 p
     on p.challenge_id=ch.id and p.user_id=new.user_id
   where ch.status='ACTIVE'
     and now()>=ch.starts_at
     and now()<ch.ends_at
     and p.completed_at is null
 loop
   -- Do not let aggregate MOVE v3 evidence unlock cash/physical rewards.
   -- Those reward classes require a stronger verification path.
   if v_move_v3 and c.reward_kind in ('CASH','PHYSICAL') then
     continue;
   end if;

   v_delta:=case c.unit
     when 'COUNT' then 1
     when 'MINUTES' then greatest(0,floor(coalesce(new.duration_seconds,0)/60.0))
     when 'KM' then greatest(0,round((coalesce(new.distance_meters,0)/1000.0)::numeric,2))
   end;
   if v_delta is null or v_delta<=0 then continue; end if;

   insert into public.sponsor_events_v2(challenge_id,user_id,event_key,verified_delta)
   values(c.id,new.user_id,new.event_key,v_delta)
   on conflict do nothing;
   get diagnostics v_inserted=row_count;

   if v_inserted>0 then
     update public.sponsor_participation_v2
     set verified_value=least(c.target,verified_value+v_delta),
         completed_at=case
           when verified_value+v_delta>=c.target then coalesce(completed_at,now())
           else completed_at
         end
     where challenge_id=c.id and user_id=new.user_id
     returning verified_value into v_total;

     if v_total>=c.target then
       insert into public.sponsor_reward_claims_v2(challenge_id,user_id)
       values(c.id,new.user_id)
       on conflict do nothing;
     end if;
   end if;
 end loop;
 return new;
end $$;

drop trigger if exists verification_summary_sponsor_route on public.verification_summaries;
create trigger verification_summary_sponsor_route
after insert on public.verification_summaries
for each row execute function public.route_verification_to_sponsor_challenges();

revoke all on function public.route_verification_to_sponsor_challenges()
from public,anon,authenticated;
