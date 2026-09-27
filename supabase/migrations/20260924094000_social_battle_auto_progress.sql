-- Auto-route canonical verified rewards into active social combat systems.
alter table public.pvp_events drop constraint if exists pvp_events_user_id_event_key_key;
alter table public.guild_war_events drop constraint if exists guild_war_events_user_id_event_key_key;

create or replace function public.route_verified_reward_to_social_battles()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare c record; w record; r record; v_value bigint; v_inserted integer; v_guild uuid; v_damage integer;
begin
 if new.source_type<>'VERIFIED_EVENT' or new.evidence_event_key is null then return new; end if;

 -- PvP: one verified event may naturally advance every active challenge involving the user.
 for c in
   select * from public.pvp_challenges
   where status='ACTIVE' and ends_at>now() and new.user_id in (creator_id,opponent_id)
 loop
   v_value:=case when c.metric='QUESTS' then 1 else greatest(1,least(5000,coalesce(new.real_xp,0))) end;
   insert into public.pvp_events(challenge_id,event_key,user_id,value)
   values(c.id,new.evidence_event_key,new.user_id,v_value) on conflict do nothing;
   get diagnostics v_inserted=row_count;
   if v_inserted>0 then
     update public.pvp_challenges set
       creator_score=creator_score+case when new.user_id=c.creator_id then v_value else 0 end,
       opponent_score=opponent_score+case when new.user_id=c.opponent_id then v_value else 0 end
     where id=c.id;
     update public.pvp_challenges set status='COMPLETE'
     where id=c.id and (creator_score>=target or opponent_score>=target);
   end if;
 end loop;

 -- Guild War: verified rewards contribute only if the user currently belongs to one of the two guilds.
 select gm.guild_id into v_guild from public.guild_members gm where gm.user_id=new.user_id limit 1;
 if v_guild is not null then
   for w in
     select * from public.guild_wars
     where status='ACTIVE' and ends_at>now() and v_guild in (guild_a,guild_b)
   loop
     v_value:=greatest(1,least(1000,coalesce(new.real_xp,0)+coalesce(new.energy,0)*2));
     insert into public.guild_war_events(war_id,event_key,user_id,guild_id,value)
     values(w.id,new.evidence_event_key,new.user_id,v_guild,v_value) on conflict do nothing;
     get diagnostics v_inserted=row_count;
     if v_inserted>0 then
       update public.guild_wars set
         score_a=score_a+case when v_guild=w.guild_a then v_value else 0 end,
         score_b=score_b+case when v_guild=w.guild_b then v_value else 0 end
       where id=w.id;
     end if;
   end loop;
 end if;

 -- Raid 2.0: every active global raid receives the verified contribution.
 v_damage:=greatest(1,least(500,coalesce(new.real_xp,0)+coalesce(new.energy,0)*2));
 for r in select * from public.raids where now()>=starts_at and now()<ends_at and damage<boss_hp loop
   insert into public.raid_damage(raid_id,event_key,user_id,damage)
   values(r.id,new.evidence_event_key,new.user_id,v_damage) on conflict do nothing;
   get diagnostics v_inserted=row_count;
   if v_inserted>0 then
     update public.raids
       set damage=least(boss_hp,damage+v_damage),
           status=case when damage+v_damage>=boss_hp then 'DEFEATED' else 'ACTIVE' end
       where id=r.id;
   end if;
 end loop;

 return new;
end $$;

drop trigger if exists reward_ledger_social_battle_route on public.reward_ledger;
create trigger reward_ledger_social_battle_route
after insert on public.reward_ledger
for each row execute function public.route_verified_reward_to_social_battles();

revoke all on function public.route_verified_reward_to_social_battles() from public,anon,authenticated;
