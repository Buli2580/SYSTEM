-- Trigger-only SECURITY DEFINER functions must not be callable through the Data API.
revoke all on function public.social_profiles_set_updated_at() from public, anon, authenticated;
revoke all on function public.sync_follow_counts() from public, anon, authenticated;
revoke all on function public.sync_social_progress_projection() from public, anon, authenticated;
