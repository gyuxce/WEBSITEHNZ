-- Harunokaze Portal — initial schema
-- Run in Supabase SQL Editor or via: supabase db push

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  whatsapp text,
  program_interest text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Progress tracker (6 steps from landing)
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  registration_status text not null default 'completed',
  payment_status text not null default 'pending',
  language_test_status text not null default 'locked',
  character_test_status text not null default 'locked',
  result_status text not null default 'locked',
  consultation_status text not null default 'optional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_progress_payment_status_check
    check (payment_status in ('pending', 'paid', 'verified')),
  constraint user_progress_language_test_status_check
    check (language_test_status in ('locked', 'available', 'in_progress', 'completed')),
  constraint user_progress_character_test_status_check
    check (character_test_status in ('locked', 'available', 'in_progress', 'completed')),
  constraint user_progress_result_status_check
    check (result_status in ('locked', 'available', 'completed'))
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
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

-- Test questions
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

-- Test sessions
create table if not exists public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  test_type text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer,
  passed boolean,
  constraint test_sessions_type_check check (test_type in ('language', 'character'))
);

-- Test answers
create table if not exists public.test_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_sessions (id) on delete cascade,
  question_id uuid not null references public.test_questions (id) on delete cascade,
  answer text,
  is_correct boolean
);

-- Certificates / results
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  certificate_code text not null unique,
  score integer not null,
  recommendation text not null,
  issued_at timestamptz not null default now()
);

-- Updated_at trigger
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

-- Auto-create profile + progress on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, whatsapp, program_interest, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Peserta'),
    new.raw_user_meta_data ->> 'whatsapp',
    new.raw_user_meta_data ->> 'program_interest',
    new.raw_user_meta_data ->> 'city'
  );

  insert into public.user_progress (user_id)
  values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Unlock language test when payment verified
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

-- RLS
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.payments enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_sessions enable row level security;
alter table public.test_answers enable row level security;
alter table public.certificates enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Progress policies
create policy "Users can view own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);

-- Payments policies
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users can insert own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- Test questions — readable by authenticated users
create policy "Authenticated users can read active questions"
  on public.test_questions for select
  to authenticated
  using (active = true);

-- Test sessions
create policy "Users manage own test sessions"
  on public.test_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Test answers via session ownership
create policy "Users manage own test answers"
  on public.test_answers for all
  using (
    exists (
      select 1 from public.test_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.test_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- Certificates
create policy "Users can view own certificates"
  on public.certificates for select
  using (auth.uid() = user_id);

create policy "Users can insert own certificates"
  on public.certificates for insert
  with check (auth.uid() = user_id);

-- Seed sample language test questions
insert into public.test_questions (test_type, question_text, options, correct_answer, order_index) values
(
  'language',
  'Apa arti kata 「おはよう」 dalam bahasa Indonesia?',
  '[{"label":"Selamat malam","value":"a"},{"label":"Selamat pagi","value":"b"},{"label":"Terima kasih","value":"c"},{"label":"Permisi","value":"d"}]'::jsonb,
  'b', 1
),
(
  'language',
  'Hiragana 「あ」 dibaca sebagai...',
  '[{"label":"i","value":"a"},{"label":"u","value":"b"},{"label":"a","value":"c"},{"label":"e","value":"d"}]'::jsonb,
  'c', 2
),
(
  'language',
  'Partikel 「は」 dalam kalimat 「わたしはがくせいです」 berfungsi sebagai...',
  '[{"label":"Penanda subjek/topik","value":"a"},{"label":"Penanda objek","value":"b"},{"label":"Penanda tempat","value":"c"},{"label":"Penanda waktu","value":"d"}]'::jsonb,
  'a', 3
),
(
  'language',
  'Angka 5 dalam kanji ditulis...',
  '[{"label":"三","value":"a"},{"label":"四","value":"b"},{"label":"五","value":"c"},{"label":"六","value":"d"}]'::jsonb,
  'c', 4
),
(
  'language',
  '「ありがとうございます」 artinya...',
  '[{"label":"Maaf","value":"a"},{"label":"Sampai jumpa","value":"b"},{"label":"Terima kasih","value":"c"},{"label":"Selamat datang","value":"d"}]'::jsonb,
  'c', 5
);
