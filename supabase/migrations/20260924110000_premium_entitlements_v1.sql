-- SYSTEM PREMIUM ENTITLEMENTS v1
-- Fail-closed billing foundation. Mobile clients can only read their entitlement.
-- Purchase/webhook processors may update this table later with service-role credentials.

create table if not exists public.premium_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'FREE' check(plan in ('FREE','PREMIUM')),
  provider text check(provider is null or provider in ('GOOGLE_PLAY','APP_STORE','ADMIN','PROMO')),
  product_id text,
  entitlement_key text not null default 'SYSTEM_PREMIUM',
  valid_until timestamptz,
  source_reference text,
  updated_at timestamptz not null default now()
);

alter table public.premium_entitlements enable row level security;

drop policy if exists premium_entitlements_own_read on public.premium_entitlements;
create policy premium_entitlements_own_read
on public.premium_entitlements for select to authenticated
using(user_id=(select auth.uid()));

create or replace function public.get_my_premium_entitlement()
returns table(
 plan text,
 provider text,
 product_id text,
 entitlement_key text,
 valid_until timestamptz,
 active boolean
)
language plpgsql stable security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 return query
 select
   coalesce(e.plan,'FREE'),
   e.provider,
   e.product_id,
   coalesce(e.entitlement_key,'SYSTEM_PREMIUM'),
   e.valid_until,
   (coalesce(e.plan,'FREE')='PREMIUM' and (e.valid_until is null or e.valid_until>now()))
 from (select v_uid as user_id) u
 left join public.premium_entitlements e on e.user_id=u.user_id;
end $$;

revoke all on table public.premium_entitlements from anon,authenticated;
grant select on table public.premium_entitlements to authenticated;
revoke all on function public.get_my_premium_entitlement() from public,anon;
grant execute on function public.get_my_premium_entitlement() to authenticated;
