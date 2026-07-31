-- Allow admin to unlock certificate (result_status) after PAPI review.
-- Participants create their own certificate row when opening /certificate.

drop policy if exists "Admins can update any progress" on public.user_progress;
create policy "Admins can update any progress"
  on public.user_progress for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can insert certificates" on public.certificates;
create policy "Admins can insert certificates"
  on public.certificates for insert
  with check (public.is_admin());

drop policy if exists "Admins can view all certificates" on public.certificates;
create policy "Admins can view all certificates"
  on public.certificates for select
  using (public.is_admin() or auth.uid() = user_id);
