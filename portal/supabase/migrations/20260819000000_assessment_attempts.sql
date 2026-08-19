-- Persistent assessment attempts for server-based deadlines and autosave.
-- Participants get one attempt per assessment type. Refreshing the browser
-- resumes the same attempt instead of starting a new timer.

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  assessment_type text not null,
  status text not null default 'in_progress',
  duration_seconds integer not null,
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  step_started_at timestamptz not null default now(),
  step_deadline_at timestamptz,
  current_step integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  last_saved_at timestamptz not null default now(),
  completed_at timestamptz,
  timed_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_attempts_type_check
    check (assessment_type in ('pimsleur', 'cfit', 'papikostik')),
  constraint assessment_attempts_status_check
    check (status in ('in_progress', 'completed')),
  constraint assessment_attempts_duration_check
    check (duration_seconds > 0),
  constraint assessment_attempts_step_check
    check (current_step >= 0),
  constraint assessment_attempts_answers_check
    check (jsonb_typeof(answers) = 'object'),
  constraint assessment_attempts_user_type_unique
    unique (user_id, assessment_type)
);

create index if not exists assessment_attempts_user_status_idx
  on public.assessment_attempts (user_id, status);

drop trigger if exists assessment_attempts_updated_at on public.assessment_attempts;
create trigger assessment_attempts_updated_at
  before update on public.assessment_attempts
  for each row execute function public.set_updated_at();

alter table public.assessment_attempts enable row level security;

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

create or replace function public.save_assessment_attempt(
  p_attempt_id uuid,
  p_answers jsonb,
  p_current_step integer default 0
)
returns table (
  id uuid,
  status text,
  deadline_at timestamptz,
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
  saved_attempt public.assessment_attempts;
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

  update public.assessment_attempts
  set
    answers = p_answers,
    current_step = p_current_step,
    last_saved_at = now()
  where assessment_attempts.id = p_attempt_id
    and assessment_attempts.user_id = auth.uid()
    and assessment_attempts.status = 'in_progress'
  returning * into saved_attempt;

  if saved_attempt.id is null then
    select *
    into saved_attempt
    from public.assessment_attempts
    where assessment_attempts.id = p_attempt_id
      and assessment_attempts.user_id = auth.uid();
  end if;

  if saved_attempt.id is null then
    raise exception 'assessment attempt not found';
  end if;

  return query
  select
    saved_attempt.id,
    saved_attempt.status,
    saved_attempt.deadline_at,
    saved_attempt.step_deadline_at,
    saved_attempt.current_step,
    saved_attempt.answers,
    saved_attempt.last_saved_at,
    saved_attempt.completed_at,
    saved_attempt.timed_out;
end;
$$;

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

revoke all on function public.start_assessment_attempt(text, integer, integer) from public;
revoke all on function public.save_assessment_attempt(uuid, jsonb, integer) from public;
revoke all on function public.advance_assessment_attempt(uuid, integer, integer) from public;
revoke all on function public.finish_assessment_attempt(uuid, jsonb, integer) from public;
grant execute on function public.start_assessment_attempt(text, integer, integer) to authenticated;
grant execute on function public.save_assessment_attempt(uuid, jsonb, integer) to authenticated;
grant execute on function public.advance_assessment_attempt(uuid, integer, integer) to authenticated;
grant execute on function public.finish_assessment_attempt(uuid, jsonb, integer) to authenticated;
