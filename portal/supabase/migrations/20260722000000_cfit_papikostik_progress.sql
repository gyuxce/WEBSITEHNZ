-- CFIT + PAPI Kostick readiness.
-- This migration adds progress columns and allows official materials to be
-- inserted into test_questions when they are ready.

alter table public.profiles
  add column if not exists birth_date date;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, whatsapp, birth_date, program_interest, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Peserta'),
    new.raw_user_meta_data ->> 'whatsapp',
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    new.raw_user_meta_data ->> 'program_interest',
    new.raw_user_meta_data ->> 'city'
  );

  insert into public.user_progress (user_id)
  values (new.id);

  return new;
end;
$$;

alter table public.user_progress
  add column if not exists cfit_test_status text not null default 'locked',
  add column if not exists papikostik_test_status text not null default 'locked';

alter table public.user_progress
  drop constraint if exists user_progress_cfit_test_status_check;
alter table public.user_progress
  add constraint user_progress_cfit_test_status_check
    check (cfit_test_status in ('locked', 'available', 'in_progress', 'completed'));

alter table public.user_progress
  drop constraint if exists user_progress_papikostik_test_status_check;
alter table public.user_progress
  add constraint user_progress_papikostik_test_status_check
    check (papikostik_test_status in ('locked', 'available', 'in_progress', 'completed'));

alter table public.test_questions
  drop constraint if exists test_questions_type_check;
alter table public.test_questions
  add constraint test_questions_type_check
    check (test_type in ('language', 'character', 'cfit', 'papikostik'));

create table if not exists public.cfit_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  raw_subtest1 integer,
  raw_subtest2 integer,
  raw_subtest3 integer,
  raw_subtest4 integer,
  raw_total integer,
  iq integer,
  category text,
  age_years integer,
  age_months integer,
  norm_code text,
  duration_seconds integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.cfit_results
  add column if not exists age_years integer,
  add column if not exists age_months integer,
  add column if not exists norm_code text;

create unique index if not exists cfit_results_user_id_unique on public.cfit_results (user_id);
create index if not exists cfit_results_completed_at_idx on public.cfit_results (completed_at desc);

alter table public.cfit_results enable row level security;

drop policy if exists "Users can view own cfit results" on public.cfit_results;
create policy "Users can view own cfit results"
  on public.cfit_results for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own cfit results" on public.cfit_results;
create policy "Users can insert own cfit results"
  on public.cfit_results for insert
  with check (auth.uid() = user_id);

update public.user_progress
set
  cfit_test_status = case
    when cfit_test_status = 'locked' and language_test_status = 'completed' then 'available'
    else cfit_test_status
  end,
  papikostik_test_status = case
    when papikostik_test_status = 'locked' and cfit_test_status = 'completed' then 'available'
    else papikostik_test_status
  end
where language_test_status = 'completed' or cfit_test_status = 'completed';

create or replace function public.admin_list_cfit_results()
returns table (
  id uuid,
  user_id uuid,
  raw_subtest1 integer,
  raw_subtest2 integer,
  raw_subtest3 integer,
  raw_subtest4 integer,
  raw_total integer,
  iq integer,
  category text,
  age_years integer,
  age_months integer,
  norm_code text,
  duration_seconds integer,
  completed_at timestamptz,
  full_name text,
  email text,
  whatsapp text,
  city text,
  birth_date date
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    r.id,
    r.user_id,
    r.raw_subtest1,
    r.raw_subtest2,
    r.raw_subtest3,
    r.raw_subtest4,
    r.raw_total,
    r.iq,
    r.category,
    r.age_years,
    r.age_months,
    r.norm_code,
    r.duration_seconds,
    r.completed_at,
    coalesce(
      nullif(nullif(trim(p.full_name), ''), 'Peserta'),
      split_part(u.email, '@', 1),
      'Peserta'
    ) as full_name,
    u.email::text,
    p.whatsapp,
    p.city,
    p.birth_date
  from public.cfit_results r
  left join public.profiles p on p.id = r.user_id
  left join auth.users u on u.id = r.user_id
  order by r.completed_at desc;
end;
$$;

revoke all on function public.admin_list_cfit_results() from public;
grant execute on function public.admin_list_cfit_results() to authenticated;

create or replace function public.admin_get_cfit_detail(p_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  answers jsonb,
  raw_subtest1 integer,
  raw_subtest2 integer,
  raw_subtest3 integer,
  raw_subtest4 integer,
  raw_total integer,
  iq integer,
  category text,
  age_years integer,
  age_months integer,
  norm_code text,
  duration_seconds integer,
  completed_at timestamptz,
  full_name text,
  email text,
  whatsapp text,
  city text,
  birth_date date
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    r.id,
    r.user_id,
    r.answers,
    r.raw_subtest1,
    r.raw_subtest2,
    r.raw_subtest3,
    r.raw_subtest4,
    r.raw_total,
    r.iq,
    r.category,
    r.age_years,
    r.age_months,
    r.norm_code,
    r.duration_seconds,
    r.completed_at,
    coalesce(
      nullif(nullif(trim(p.full_name), ''), 'Peserta'),
      split_part(u.email, '@', 1),
      'Peserta'
    ) as full_name,
    u.email::text,
    p.whatsapp,
    p.city,
    p.birth_date
  from public.cfit_results r
  left join public.profiles p on p.id = r.user_id
  left join auth.users u on u.id = r.user_id
  where r.user_id = p_user_id
  order by r.completed_at desc
  limit 1;
end;
$$;

revoke all on function public.admin_get_cfit_detail(uuid) from public;
grant execute on function public.admin_get_cfit_detail(uuid) to authenticated;
