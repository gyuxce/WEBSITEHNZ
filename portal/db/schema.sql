-- Harunokaze Portal — Neon Postgres schema (Better Auth + app tables)
-- Jalankan sekali di Neon SQL Editor (atau via neonctl).

create extension if not exists "pgcrypto";

-- ─── Better Auth core ───────────────────────────────────────────────
create table if not exists "user" (
  id text primary key,
  name text not null,
  email text not null unique,
  "emailVerified" boolean not null default false,
  image text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "session" (
  id text primary key,
  "expiresAt" timestamptz not null,
  token text not null unique,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user" (id) on delete cascade
);

create index if not exists session_userId_idx on "session" ("userId");

create table if not exists "account" (
  id text primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user" (id) on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists account_userId_idx on "account" ("userId");

create table if not exists "verification" (
  id text primary key,
  identifier text not null,
  value text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- ─── App tables ─────────────────────────────────────────────────────
create table if not exists public.profiles (
  id text primary key references "user" (id) on delete cascade,
  full_name text not null,
  whatsapp text,
  program_interest text,
  city text,
  role text not null default 'participant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('participant', 'admin'))
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique references "user" (id) on delete cascade,
  registration_status text not null default 'completed',
  payment_status text not null default 'pending',
  language_test_status text not null default 'locked',
  cfit_test_status text not null default 'locked',
  character_test_status text not null default 'locked',
  result_status text not null default 'locked',
  consultation_status text not null default 'optional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_progress_payment_status_check
    check (payment_status in ('pending', 'paid', 'verified')),
  constraint user_progress_language_test_status_check
    check (language_test_status in ('locked', 'available', 'in_progress', 'completed')),
  constraint user_progress_cfit_test_status_check
    check (cfit_test_status in ('locked', 'available', 'in_progress', 'completed')),
  constraint user_progress_character_test_status_check
    check (character_test_status in ('locked', 'available', 'in_progress', 'completed')),
  constraint user_progress_result_status_check
    check (result_status in ('locked', 'available', 'completed'))
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" (id) on delete cascade,
  order_id text not null unique,
  amount integer not null,
  status text not null default 'pending',
  midtrans_transaction_id text,
  payment_type text not null default 'pemetaan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_status_check
    check (status in ('pending', 'settlement', 'expire', 'cancel', 'deny'))
);

create table if not exists public.pimsleur_results (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" (id) on delete cascade,
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
create index if not exists pimsleur_results_completed_at_idx on public.pimsleur_results (completed_at desc);

create table if not exists public.cfit_results (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" (id) on delete cascade,
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
  category_color text not null default 'green',
  category_label text not null default 'Kategori hijau — Rata-rata ke atas',
  duration_seconds integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint cfit_results_category_color_check
    check (category_color in ('red', 'yellow', 'green'))
);

create unique index if not exists cfit_results_user_id_unique on public.cfit_results (user_id);
create index if not exists cfit_results_completed_at_idx on public.cfit_results (completed_at desc);

-- Legacy tables (opsional /result/legacy)
create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_type text not null,
  question_text text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  order_index integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint test_questions_type_check check (test_type in ('language', 'character'))
);

create table if not exists public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" (id) on delete cascade,
  test_type text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer,
  passed boolean,
  constraint test_sessions_type_check check (test_type in ('language', 'character'))
);

create table if not exists public.test_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_sessions (id) on delete cascade,
  question_id uuid not null references public.test_questions (id) on delete cascade,
  answer text,
  is_correct boolean
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" (id) on delete cascade,
  certificate_code text not null unique,
  score integer not null,
  recommendation text not null,
  issued_at timestamptz not null default now()
);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists user_progress_updated_at on public.user_progress;
create trigger user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- Unlock Pimsleur when payment settles
create or replace function public.handle_payment_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'settlement' and (old.status is distinct from 'settlement') then
    update public.user_progress
    set
      payment_status = 'verified',
      language_test_status = 'available',
      updated_at = now()
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_payment_settlement on public.payments;
create trigger on_payment_settlement
  after update on public.payments
  for each row execute function public.handle_payment_verified();
