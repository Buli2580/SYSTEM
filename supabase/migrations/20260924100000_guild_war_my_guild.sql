create or replace function public.get_my_guild_summary()
returns table(guild_id uuid,name text,tag text,role text,level integer,xp bigint)
language sql stable security definer set search_path=''
as $$
 select g.id,g.name,g.tag,gm.role,g.level,g.xp
 from public.guild_members gm
 join public.guilds g on g.id=gm.guild_id
 where gm.user_id=(select auth.uid())
 limit 1
$$;
revoke all on function public.get_my_guild_summary() from public,anon;
grant execute on function public.get_my_guild_summary() to authenticated;
