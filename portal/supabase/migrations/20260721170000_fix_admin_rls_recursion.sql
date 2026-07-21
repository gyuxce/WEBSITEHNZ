-- Fix infinite recursion on profiles RLS when checking admin role.
-- Policy that SELECTs from profiles inside a profiles policy causes 42P17.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;

-- profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- user_progress
drop policy if exists "Admins can view all progress" on public.user_progress;
create policy "Admins can view all progress"
  on public.user_progress for select
  using (auth.uid() = user_id or public.is_admin());

-- pimsleur_results
drop policy if exists "Users can view own pimsleur results" on public.pimsleur_results;
create policy "Users can view own pimsleur results"
  on public.pimsleur_results for select
  using (auth.uid() = user_id or public.is_admin());
