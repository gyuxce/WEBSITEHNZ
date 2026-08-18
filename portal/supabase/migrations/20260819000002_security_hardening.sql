-- Security hardening for role escalation, participant progress mutations,
-- and direct assessment-result inserts.

create or replace function public.guard_profile_role_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') not in ('service_role', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'profile role can only be changed by an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_mutation on public.profiles;
create trigger guard_profile_role_mutation
  before update on public.profiles
  for each row execute function public.guard_profile_role_mutation();

create or replace function public.has_active_assessment_attempt(p_assessment_type text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assessment_attempts attempt
    where attempt.user_id = auth.uid()
      and attempt.assessment_type = p_assessment_type
      and attempt.status = 'in_progress'
  );
$$;

revoke all on function public.has_active_assessment_attempt(text) from public;
grant execute on function public.has_active_assessment_attempt(text) to authenticated;

-- A participant may update only the transitions performed by the test flow.
-- Payment, QC, approval, and role-like progress changes remain server/admin-only.
create or replace function public.guard_participant_progress_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text := coalesce(auth.role(), '');
begin
  if actor_role in ('service_role', 'supabase_admin') or public.is_admin() then
    return new;
  end if;

  -- Psychologists may only perform the intended handoff from their review to QC.
  if public.is_psychologist() then
    if auth.uid() <> new.user_id
       and old.final_review_status in ('locked', 'pending_psychologist')
       and new.final_review_status = 'pending_qc'
       and new.result_status = old.result_status
       and new.payment_status = old.payment_status
       and new.language_test_status = old.language_test_status
       and new.character_test_status = old.character_test_status
       and new.cfit_test_status = old.cfit_test_status
       and new.papikostik_test_status = old.papikostik_test_status
       and new.registration_status = old.registration_status
       and new.consultation_status = old.consultation_status then
      return new;
    end if;
    if auth.uid() = new.user_id then
      raise exception 'psychologist cannot edit participant progress directly';
    end if;
    raise exception 'psychologist progress transition is not allowed';
  end if;

  if auth.uid() is null or auth.uid() <> new.user_id then
    raise exception 'cannot edit another participant progress';
  end if;

  if new.payment_status is distinct from old.payment_status then
    raise exception 'payment status can only be changed by verified server callback';
  end if;

  if new.registration_status is distinct from old.registration_status
     or new.consultation_status is distinct from old.consultation_status then
    raise exception 'registration and consultation status are server-managed';
  end if;

  if new.language_test_status is distinct from old.language_test_status then
    if old.language_test_status = 'available'
       and new.language_test_status = 'in_progress'
       and public.has_active_assessment_attempt('pimsleur') then
      null;
    elsif old.language_test_status = 'in_progress'
      and new.language_test_status = 'completed'
      and exists (
        select 1 from public.pimsleur_results result
        where result.user_id = new.user_id
      ) then
      null;
    else
      raise exception 'invalid Pimsleur progress transition';
    end if;
  end if;

  if new.cfit_test_status is distinct from old.cfit_test_status then
    if old.cfit_test_status = 'available'
       and new.cfit_test_status = 'in_progress'
       and public.has_active_assessment_attempt('cfit') then
      null;
    elsif old.cfit_test_status = 'locked'
      and new.cfit_test_status = 'available'
      and new.language_test_status = 'completed'
      and exists (
        select 1 from public.pimsleur_results result
        where result.user_id = new.user_id
      ) then
      null;
    elsif old.cfit_test_status = 'in_progress'
      and new.cfit_test_status = 'completed'
      and exists (
        select 1 from public.cfit_results result
        where result.user_id = new.user_id
      ) then
      null;
    else
      raise exception 'invalid CFIT progress transition';
    end if;
  end if;

  if new.papikostik_test_status is distinct from old.papikostik_test_status then
    if old.papikostik_test_status = 'available'
       and new.papikostik_test_status = 'in_progress'
       and public.has_active_assessment_attempt('papikostik') then
      null;
    elsif old.papikostik_test_status = 'locked'
      and new.papikostik_test_status = 'available'
      and new.cfit_test_status = 'completed'
      and exists (
        select 1 from public.cfit_results result
        where result.user_id = new.user_id
      ) then
      null;
    elsif old.papikostik_test_status = 'in_progress'
      and new.papikostik_test_status = 'completed'
      and exists (
        select 1 from public.papikostik_results result
        where result.user_id = new.user_id
      ) then
      null;
    else
      raise exception 'invalid PAPI Kostick progress transition';
    end if;
  end if;

  if new.character_test_status is distinct from old.character_test_status then
    if old.character_test_status = 'locked'
       and new.character_test_status = 'available'
       and new.language_test_status = 'completed'
       and exists (
         select 1 from public.test_sessions session
         where session.user_id = new.user_id
           and session.test_type = 'language'
           and session.completed_at is not null
       ) then
      null;
    elsif old.character_test_status = 'available'
      and new.character_test_status = 'completed'
      and exists (
        select 1 from public.test_sessions session
        where session.user_id = new.user_id
          and session.test_type = 'character'
          and session.completed_at is not null
      ) then
      null;
    else
      raise exception 'invalid character-test progress transition';
    end if;
  end if;

  if new.final_review_status is distinct from old.final_review_status then
    if old.final_review_status = 'locked'
       and new.final_review_status = 'pending_psychologist'
       and new.language_test_status = 'completed'
       and new.cfit_test_status = 'completed'
       and new.papikostik_test_status = 'completed'
       and exists (select 1 from public.pimsleur_results where user_id = new.user_id)
       and exists (select 1 from public.cfit_results where user_id = new.user_id)
       and exists (select 1 from public.papikostik_results where user_id = new.user_id) then
      null;
    else
      raise exception 'final review status is server-managed';
    end if;
  end if;

  if new.result_status is distinct from old.result_status then
    if new.result_status = 'completed' or old.result_status = 'completed' then
      raise exception 'result completion requires admin approval';
    end if;
    if new.result_status <> 'available' then
      raise exception 'invalid result status transition';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_participant_progress_mutation on public.user_progress;
create trigger guard_participant_progress_mutation
  before update on public.user_progress
  for each row execute function public.guard_participant_progress_mutation();

-- Results can only be inserted while the matching server-tracked attempt is open.
drop policy if exists "Users can insert own pimsleur results" on public.pimsleur_results;
create policy "Users can insert own pimsleur results"
  on public.pimsleur_results for insert
  with check (
    auth.uid() = user_id
    and public.has_active_assessment_attempt('pimsleur')
  );

drop policy if exists "Users can insert own cfit results" on public.cfit_results;
create policy "Users can insert own cfit results"
  on public.cfit_results for insert
  with check (
    auth.uid() = user_id
    and public.has_active_assessment_attempt('cfit')
  );

drop policy if exists "Users can insert own papikostik results" on public.papikostik_results;
create policy "Users can insert own papikostik results"
  on public.papikostik_results for insert
  with check (
    auth.uid() = user_id
    and public.has_active_assessment_attempt('papikostik')
    and review_status = 'pending'
    and psychologist_notes is null
    and final_summary is null
  );
