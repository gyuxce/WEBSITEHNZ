-- Pimsleur results + admin role
alter table public.profiles
  add column if not exists role text not null default 'participant';

alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('participant', 'admin'));

create table if not exists public.pimsleur_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score_section2 integer not null default 0,
  score_section3 integer not null default 0,
  score_section4 integer not null default 0,
  score_section5 integer not null default 0,
  score_section6 integer not null default 0,
  score_verbal integer not null default 0,
  score_audio integer not null default 0,
  score_total integer not null default 0,
  grade text not null,
  grade_label text not null,
  status_label text not null,
  recommendation text not null,
  duration_seconds integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists pimsleur_results_user_id_unique on public.pimsleur_results (user_id);
create index if not exists pimsleur_results_user_id_idx on public.pimsleur_results (user_id);
create index if not exists pimsleur_results_completed_at_idx on public.pimsleur_results (completed_at desc);

alter table public.pimsleur_results enable row level security;

drop policy if exists "Users can view own pimsleur results" on public.pimsleur_results;
create policy "Users can view own pimsleur results"
  on public.pimsleur_results for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Users can insert own pimsleur results" on public.pimsleur_results;
create policy "Users can insert own pimsleur results"
  on public.pimsleur_results for insert
  with check (auth.uid() = user_id);

-- Admins can view all profiles & progress
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admins can view all progress" on public.user_progress;
create policy "Admins can view all progress"
  on public.user_progress for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
