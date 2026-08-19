-- Fix PL/pgSQL output-column ambiguity when advancing or completing an attempt.
-- The affected columns are explicitly read through the UPDATE target alias.

create or replace function public.advance_assessment_attempt(
  p_attempt_id uuid,
  p_current_step integer,
  p_step_duration_seconds integer
)
returns table (
  id uuid,
  status text,
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
  advanced_attempt public.assessment_attempts;
  current_attempt public.assessment_attempts;
  expected_step_duration integer;
  now_at timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_current_step is null or p_current_step < 0 then
    raise exception 'invalid current step';
  end if;
  if p_step_duration_seconds is null or p_step_duration_seconds < 30 then
    raise exception 'invalid step duration';
  end if;

  select *
  into current_attempt
  from public.assessment_attempts
  where assessment_attempts.id = p_attempt_id
    and assessment_attempts.user_id = auth.uid();

  if current_attempt.id is null then
    raise exception 'assessment attempt not found';
  end if;
  if current_attempt.assessment_type <> 'cfit' then
    raise exception 'step advancement is only supported for cfit';
  end if;

  expected_step_duration := case p_current_step
    when 1 then 8 * 60
    when 2 then 7 * 60
    when 3 then (6 * 60) + 30
    else null
  end;
  if expected_step_duration is null
     or p_step_duration_seconds <> expected_step_duration then
    raise exception 'invalid cfit step duration';
  end if;

  update public.assessment_attempts as attempt
  set
    current_step = p_current_step,
    step_started_at = now_at,
    step_deadline_at = least(
      attempt.deadline_at,
      now_at + (p_step_duration_seconds * interval '1 second')
    ),
    last_saved_at = now_at
  where attempt.id = p_attempt_id
    and attempt.user_id = auth.uid()
    and attempt.status = 'in_progress'
    and attempt.deadline_at > now_at
  returning * into advanced_attempt;

  if advanced_attempt.id is null then
    select *
    into advanced_attempt
    from public.assessment_attempts
    where assessment_attempts.id = p_attempt_id
      and assessment_attempts.user_id = auth.uid();
  end if;

  if advanced_attempt.id is null then
    raise exception 'assessment attempt not found';
  end if;

  return query
  select
    advanced_attempt.id,
    advanced_attempt.status,
    advanced_attempt.deadline_at,
    advanced_attempt.step_started_at,
    advanced_attempt.step_deadline_at,
    advanced_attempt.current_step,
    advanced_attempt.answers,
    advanced_attempt.last_saved_at,
    advanced_attempt.completed_at,
    advanced_attempt.timed_out;
end;
$$;

create or replace function public.finish_assessment_attempt(
  p_attempt_id uuid,
  p_answers jsonb,
  p_current_step integer default 0
)
returns table (
  id uuid,
  status text,
  deadline_at timestamptz,
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
  finished_attempt public.assessment_attempts;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'answers must be an object';
  end if;
  if p_current_step is null or p_current_step < 0 then
    raise exception 'invalid current step';
  end if;

  update public.assessment_attempts as attempt
  set
    status = 'completed',
    answers = p_answers,
    current_step = p_current_step,
    last_saved_at = now(),
    completed_at = coalesce(attempt.completed_at, now()),
    timed_out = attempt.deadline_at <= now()
  where attempt.id = p_attempt_id
    and attempt.user_id = auth.uid()
    and attempt.status = 'in_progress'
  returning * into finished_attempt;

  if finished_attempt.id is null then
    select *
    into finished_attempt
    from public.assessment_attempts
    where assessment_attempts.id = p_attempt_id
      and assessment_attempts.user_id = auth.uid();
  end if;

  if finished_attempt.id is null then
    raise exception 'assessment attempt not found';
  end if;

  return query
  select
    finished_attempt.id,
    finished_attempt.status,
    finished_attempt.deadline_at,
    finished_attempt.current_step,
    finished_attempt.answers,
    finished_attempt.last_saved_at,
    finished_attempt.completed_at,
    finished_attempt.timed_out;
end;
$$;

revoke all on function public.advance_assessment_attempt(uuid, integer, integer) from public;
revoke all on function public.finish_assessment_attempt(uuid, jsonb, integer) from public;
grant execute on function public.advance_assessment_attempt(uuid, integer, integer) to authenticated;
grant execute on function public.finish_assessment_attempt(uuid, jsonb, integer) to authenticated;

notify pgrst, 'reload schema';
