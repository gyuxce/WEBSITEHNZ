-- Per-participant assessment invoices and hardened payment settlement flow.

create table if not exists public.assessment_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  invoice_number text not null unique,
  amount integer not null check (amount > 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  description text not null default 'Pemetaan Potensi Harunokaze',
  status text not null default 'issued' check (status in ('issued', 'paid', 'cancelled')),
  due_date date,
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_invoices_status_idx
  on public.assessment_invoices (status, issued_at desc);

drop trigger if exists set_assessment_invoices_updated_at on public.assessment_invoices;
create trigger set_assessment_invoices_updated_at
  before update on public.assessment_invoices
  for each row execute function public.set_updated_at();

alter table public.assessment_invoices enable row level security;

drop policy if exists "Participants can view own assessment invoice" on public.assessment_invoices;
create policy "Participants can view own assessment invoice"
  on public.assessment_invoices for select
  using (auth.uid() = user_id or public.is_admin());

alter table public.payments
  add column if not exists invoice_id uuid,
  add column if not exists currency text not null default 'IDR';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_invoice_id_fkey'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_invoice_id_fkey
      foreign key (invoice_id) references public.assessment_invoices (id) on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_currency_check'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_currency_check check (currency = 'IDR');
  end if;
end;
$$;

create index if not exists payments_invoice_id_idx
  on public.payments (invoice_id, created_at desc);
create unique index if not exists payments_one_pending_per_invoice_idx
  on public.payments (invoice_id)
  where invoice_id is not null and status = 'pending';

-- Payment attempts are created only by the server-side Edge Function.
drop policy if exists "Users can insert own payments" on public.payments;

drop policy if exists "Admins can view all payments" on public.payments;
create policy "Admins can view all payments"
  on public.payments for select
  using (auth.uid() = user_id or public.is_admin());

-- Existing test pages still update their own progress, but participants may
-- never mark payment as paid/verified themselves.
create or replace function public.guard_participant_payment_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status is distinct from old.payment_status
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'payment status can only be changed by verified server callback';
  end if;

  if coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin()
     and old.payment_status not in ('paid', 'verified')
     and (
       new.language_test_status is distinct from old.language_test_status
       or new.character_test_status is distinct from old.character_test_status
       or new.cfit_test_status is distinct from old.cfit_test_status
       or new.papikostik_test_status is distinct from old.papikostik_test_status
       or new.final_review_status is distinct from old.final_review_status
       or new.result_status is distinct from old.result_status
     ) then
    raise exception 'test progress is locked until payment is verified';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_participant_payment_progress() from public;

drop trigger if exists guard_participant_payment_progress on public.user_progress;
create trigger guard_participant_payment_progress
  before update on public.user_progress
  for each row execute function public.guard_participant_payment_progress();

create or replace function public.admin_list_assessment_invoices()
returns table (
  user_id uuid,
  full_name text,
  email text,
  whatsapp text,
  city text,
  invoice_id uuid,
  invoice_number text,
  amount integer,
  currency text,
  description text,
  invoice_status text,
  due_date date,
  issued_at timestamptz,
  paid_at timestamptz,
  progress_payment_status text,
  last_payment_status text,
  last_payment_at timestamptz
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
    u.id,
    coalesce(
      nullif(nullif(trim(p.full_name), ''), 'Peserta'),
      split_part(u.email, '@', 1),
      'Peserta'
    ),
    u.email::text,
    p.whatsapp,
    p.city,
    invoice.id,
    invoice.invoice_number,
    invoice.amount,
    invoice.currency,
    invoice.description,
    invoice.status,
    invoice.due_date,
    invoice.issued_at,
    invoice.paid_at,
    progress.payment_status,
    latest_payment.status,
    latest_payment.created_at
  from auth.users u
  join public.profiles p on p.id = u.id
  join public.user_progress progress on progress.user_id = u.id
  left join public.assessment_invoices invoice on invoice.user_id = u.id
  left join lateral (
    select payment.status, payment.created_at
    from public.payments payment
    where payment.invoice_id = invoice.id
    order by payment.created_at desc
    limit 1
  ) latest_payment on true
  where p.role = 'participant'
  order by lower(coalesce(nullif(trim(p.full_name), ''), u.email::text));
end;
$$;

revoke all on function public.admin_list_assessment_invoices() from public;
grant execute on function public.admin_list_assessment_invoices() to authenticated;

create or replace function public.admin_upsert_assessment_invoice(
  p_user_id uuid,
  p_amount integer,
  p_description text,
  p_due_date date
)
returns public.assessment_invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_invoice public.assessment_invoices;
  saved_invoice public.assessment_invoices;
  generated_number text;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invoice amount must be greater than zero';
  end if;

  if length(trim(coalesce(p_description, ''))) > 120 then
    raise exception 'invoice description cannot exceed 120 characters';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role = 'participant'
  ) then
    raise exception 'participant not found';
  end if;

  select *
  into existing_invoice
  from public.assessment_invoices
  where user_id = p_user_id
  for update;

  if existing_invoice.id is not null and existing_invoice.status = 'paid' then
    raise exception 'paid invoice cannot be edited';
  end if;

  if existing_invoice.id is null and exists (
    select 1
    from public.user_progress progress
    where progress.user_id = p_user_id
      and progress.payment_status in ('paid', 'verified')
  ) then
    raise exception 'participant already has verified payment access';
  end if;

  if existing_invoice.id is not null
     and existing_invoice.amount is distinct from p_amount
     and exists (
       select 1
       from public.payments payment
       where payment.invoice_id = existing_invoice.id
         and payment.status = 'pending'
         and payment.created_at > now() - interval '30 minutes'
     ) then
    raise exception 'invoice has an active payment session; wait until it expires before changing amount';
  end if;

  generated_number := 'HNZ-' || to_char(now(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.assessment_invoices (
    user_id,
    invoice_number,
    amount,
    currency,
    description,
    status,
    due_date,
    issued_at,
    paid_at,
    created_by
  )
  values (
    p_user_id,
    generated_number,
    p_amount,
    'IDR',
    coalesce(nullif(trim(p_description), ''), 'Pemetaan Potensi Harunokaze'),
    'issued',
    p_due_date,
    now(),
    null,
    auth.uid()
  )
  on conflict (user_id) do update set
    amount = excluded.amount,
    currency = 'IDR',
    description = excluded.description,
    status = 'issued',
    due_date = excluded.due_date,
    issued_at = now(),
    paid_at = null,
    updated_at = now()
  returning * into saved_invoice;

  return saved_invoice;
end;
$$;

revoke all on function public.admin_upsert_assessment_invoice(uuid, integer, text, date) from public;
grant execute on function public.admin_upsert_assessment_invoice(uuid, integer, text, date) to authenticated;

create or replace function public.get_own_assessment_invoice()
returns table (
  id uuid,
  invoice_number text,
  amount integer,
  currency text,
  description text,
  status text,
  due_date date,
  issued_at timestamptz,
  paid_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    invoice.id,
    invoice.invoice_number,
    invoice.amount,
    invoice.currency,
    invoice.description,
    invoice.status,
    invoice.due_date,
    invoice.issued_at,
    invoice.paid_at
  from public.assessment_invoices invoice
  where invoice.user_id = auth.uid()
    and invoice.status in ('issued', 'paid')
  limit 1;
$$;

revoke all on function public.get_own_assessment_invoice() from public;
grant execute on function public.get_own_assessment_invoice() to authenticated;

-- Settlement is trusted only when the server-created payment matches its invoice.
create or replace function public.handle_payment_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  linked_invoice public.assessment_invoices;
begin
  if new.status = 'settlement' and old.status is distinct from 'settlement' then
    if new.invoice_id is null then
      raise exception 'settled payment is not linked to an invoice';
    end if;

    select *
    into linked_invoice
    from public.assessment_invoices
    where id = new.invoice_id
    for update;

    if linked_invoice.id is null then
      raise exception 'payment invoice not found';
    end if;

    if linked_invoice.user_id <> new.user_id then
      raise exception 'payment user does not match invoice owner';
    end if;

    if linked_invoice.amount <> new.amount or linked_invoice.currency <> new.currency then
      raise exception 'payment amount or currency does not match invoice';
    end if;

    update public.assessment_invoices
    set
      status = 'paid',
      paid_at = coalesce(paid_at, now()),
      updated_at = now()
    where id = linked_invoice.id;

    update public.user_progress
    set
      payment_status = 'verified',
      language_test_status = case
        when language_test_status = 'locked' then 'available'
        else language_test_status
      end,
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
