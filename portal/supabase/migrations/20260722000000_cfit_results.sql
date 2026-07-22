-- CFIT results + progress field
alter table public.user_progress
  add column if not exists cfit_test_status text not null default 'locked';

alter table public.user_progress
  drop constraint if exists user_progress_cfit_test_status_check;
alter table public.user_progress
  add constraint user_progress_cfit_test_status_check
    check (cfit_test_status in ('locked', 'available', 'in_progress', 'completed'));

-- Peserta yang sudah selesai Pimsleur: buka CFIT
update public.user_progress
set cfit_test_status = 'available'
where language_test_status = 'completed'
  and cfit_test_status = 'locked';

create table if not exists public.cfit_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  birth_date date not null,
  age_years integer not null,
  age_months integer not null,
  age_band text not null,
  score_subtest1 integer not null default 0,
  score_subtest2 integer not null default 0,
  score_subtest3 integer not null default 0,
  score_subtest4 integer not null default 0,
  score_raw integer not null default 0,
  iq integer not null default 0,
  classification text not null,
  classification_label text not null,
  duration_seconds integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists cfit_results_user_id_unique on public.cfit_results (user_id);
create index if not exists cfit_results_user_id_idx on public.cfit_results (user_id);
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
