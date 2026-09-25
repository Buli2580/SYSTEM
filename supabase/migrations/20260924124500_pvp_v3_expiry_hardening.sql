create or replace function public.get_my_pvp_challenges_v3()
returns table(
  id uuid,
  creator_id uuid,
  opponent_id uuid,
  creator_name text,
  opponent_name text,
  metric text,
  target bigint,
  creator_score bigint,
  opponent_score bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,
  my_side text,
  my_score bigint,
  rival_score bigint,
  progress_percent integer
)
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  update public.pvp_challenges
  set status='EXPIRED'
  where status in ('OPEN','ACTIVE')
    and ends_at<=now()
    and creator_score<target
    and opponent_score<target;

  return query
  select
    c.id,c.creator_id,c.opponent_id,
    coalesce(pc.display_name,'PLAYER'),
    coalesce(po.display_name,'PLAYER'),
    c.metric,c.target,c.creator_score,c.opponent_score,c.starts_at,c.ends_at,c.status,
    case when c.creator_id=v_uid then 'CREATOR' else 'OPPONENT' end,
    case when c.creator_id=v_uid then c.creator_score else c.opponent_score end,
    case when c.creator_id=v_uid then c.opponent_score else c.creator_score end,
    least(100,greatest(0,round(
      100.0*case when c.creator_id=v_uid then c.creator_score else c.opponent_score end
      /greatest(c.target,1)
    )::integer))
  from public.pvp_challenges c
  left join public.profiles pc on pc.id=c.creator_id
  left join public.profiles po on po.id=c.opponent_id
  where v_uid in (c.creator_id,c.opponent_id)
  order by
    case c.status when 'ACTIVE' then 0 when 'OPEN' then 1 when 'COMPLETE' then 2 else 3 end,
    c.created_at desc
  limit 50;
end $$;

revoke all on function public.get_my_pvp_challenges_v3() from public,anon;
grant execute on function public.get_my_pvp_challenges_v3() to authenticated;
