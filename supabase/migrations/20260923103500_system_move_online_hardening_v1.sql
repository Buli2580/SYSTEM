-- SYSTEM MOVE ONLINE hardening v1
-- Hide internal membership helper from direct API calls and cover MOVE foreign keys.

revoke all on function public.is_move_group_member(uuid) from public;
revoke all on function public.is_move_group_member(uuid) from anon;
revoke all on function public.is_move_group_member(uuid) from authenticated;

create index if not exists move_groups_owner_idx
  on public.move_groups(owner_id);
create index if not exists move_group_invites_created_by_idx
  on public.move_group_invites(created_by);
create index if not exists move_contributions_user_idx
  on public.move_contributions(user_id);
