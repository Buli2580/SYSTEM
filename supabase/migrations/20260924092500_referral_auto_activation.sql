create or replace function public.activate_referral_from_verified_reward()
returns trigger
language plpgsql security definer set search_path=''
as $$
begin
 if new.source_type='VERIFIED_EVENT' and new.evidence_event_key is not null then
   update public.referrals
   set status='ACTIVATED',activated_at=coalesce(activated_at,now())
   where referred_id=new.user_id and status='PENDING';
 end if;
 return new;
end $$;
drop trigger if exists reward_ledger_activate_referral on public.reward_ledger;
create trigger reward_ledger_activate_referral
after insert on public.reward_ledger
for each row execute function public.activate_referral_from_verified_reward();
revoke all on function public.activate_referral_from_verified_reward() from public,anon,authenticated;
