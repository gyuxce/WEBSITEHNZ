-- Fix the attempt-start RPC for Postgres PL/pgSQL variable resolution.
-- The RETURNS TABLE output parameter named assessment_type conflicts with an
-- unqualified ON CONFLICT column list. Refer to the named unique constraint
-- instead so valid participants can start their assessment sessions.

create or replace function public.start_assessment_attempt(
  p_assessment_type text,
  p_duration_seconds integer,
  p_step_duration_seconds integer default null
)
returns table (
  id uuid,
  assessment_type text,
  status text,
  duration_seconds integer,
  started_at timestamptz,
  deadline_at timestamptz,
  step_started_at timestamptz,
  step_deadline_at timestamptz,
  current_step integer,
  answers jsonb,
  last_saved_at timestamptz,
  completed_at timestamptz,
  timed_out boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_attempt public.assessment_attempts;
  created_attempt public.assessment_attempts;
  now_at timestamptz := now();
  first_step_deadline timestamptz;
  expected_duration integer;
begin
  if current_user_id is null then
    raise exception 'not authenticated';
  end if;

  if p_assessment_type not in ('pimsleur', 'cfit', 'papikostik') then
    raise exception 'invalid assessment type';
  end if;

  expected_duration := case p_assessment_type
    when 'pimsleur' then 30 * 60
    when 'cfit' then (7 * 60) + (8 * 60) + (7 * 60) + (6 * 60) + 30
    when 'papikostik' then 20 * 60
  end;

  if p_duration_seconds is null or p_duration_seconds <> expected_duration then
    raise exception 'invalid assessment duration';
  end if;

  if p_step_duration_seconds is not null
     and (p_step_duration_seconds < 30 or p_step_duration_seconds > p_duration_seconds) then
    raise exception 'invalid step duration';
  end if;

  if p_assessment_type <> 'cfit' and p_step_duration_seconds is not null then
    raise exception 'step duration is only supported for cfit';
  end if;

  if p_assessment_type = 'cfit'
     and p_step_duration_seconds is distinct from (7 * 60) then
    raise exception 'invalid initial cfit step duration';
  end if;

  if not exists (
    select 1
    from public.profiles
    where profiles.id = current_user_id
      and profiles.role = 'participant'
  ) then
    raise exception 'participant not found';
  end if;

  if p_assessment_type = 'pimsleur' and not exists (
    select 1
    from public.user_progress
    where user_progress.user_id = current_user_id
      and user_progress.payment_status in ('paid', 'verified')
      and user_progress.language_test_status <> 'completed'
  ) then
    raise exception 'pimsleur assessment is not available';
  end if;

  if p_assessment_type = 'cfit' and not exists (
    select 1
    from public.user_progress
    where user_progress.user_id = current_user_id
      and user_progress.language_test_status = 'completed'
      and user_progress.cfit_test_status <> 'completed'
  ) then
    raise exception 'cfit assessment is not available';
  end if;

  if p_assessment_type = 'papikostik' and not exists (
    select 1
    from public.user_progress
    where user_progress.user_id = current_user_id
      and user_progress.cfit_test_status = 'completed'
      and user_progress.papikostik_test_status <> 'completed'
  ) then
    raise exception 'papikostik assessment is not available';
  end if;

  select *
  into existing_attempt
  from public.assessment_attempts
  where assessment_attempts.user_id = current_user_id
    and assessment_attempts.assessment_type = p_assessment_type
  for update;

  if existing_attempt.id is null then
    first_step_deadline := case
      when p_step_duration_seconds is null then null
      else least(
        now_at + (p_duration_seconds * interval '1 second'),
        now_at + (p_step_duration_seconds * interval '1 second')
      )
    end;

    insert into public.assessment_attempts (
      user_id,
      assessment_type,
      duration_seconds,
      started_at,
      deadline_at,
      step_started_at,
      step_deadline_at
    )
    values (
      current_user_id,
      p_assessment_type,
      p_duration_seconds,
      now_at,
      now_at + (p_duration_seconds * interval '1 second'),
      now_at,
      first_step_deadline
    )
    on conflict on constraint assessment_attempts_user_type_unique do nothing
    returning * into created_attempt;

    if created_attempt.id is null then
      select *
      into existing_attempt
      from public.assessment_attempts
      where assessment_attempts.user_id = current_user_id
        and assessment_attempts.assessment_type = p_assessment_type
      for update;
    else
      existing_attempt := created_attempt;
    end if;
  end if;

  return query
  select
    existing_attempt.id,
    existing_attempt.assessment_type,
    existing_attempt.status,
    existing_attempt.duration_seconds,
    existing_attempt.started_at,
    existing_attempt.deadline_at,
    existing_attempt.step_started_at,
    existing_attempt.step_deadline_at,
    existing_attempt.current_step,
    existing_attempt.answers,
    existing_attempt.last_saved_at,
    existing_attempt.completed_at,
    existing_attempt.timed_out;
end;
$$;

revoke all on function public.start_assessment_attempt(text, integer, integer) from public;
grant execute on function public.start_assessment_attempt(text, integer, integer) to authenticated;

notify pgrst, 'reload schema';
