alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
revoke update (role) on public.profiles from authenticated;
grant update (display_name, preferences) on public.profiles to authenticated;
drop policy if exists profiles_update_own_preferences on public.profiles;
create policy profiles_update_own_preferences on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
