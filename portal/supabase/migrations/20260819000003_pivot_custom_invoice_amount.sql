-- Pivot remains the only active payment provider.
-- Rp99.000 is the default price, while admins may set a custom price per event.

create or replace function public.ensure_own_assessment_invoice()
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
language plpgsql
security definer
set search_path = public
as $$
declare
  current_invoice public.assessment_invoices;
  default_amount integer := public.assessment_invoice_default_amount();
  generated_number text;
  has_active_payment boolean := false;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.role = 'participant'
  ) then
    raise exception 'participant not found';
  end if;

  select *
  into current_invoice
  from public.assessment_invoices invoice
  where invoice.user_id = auth.uid()
  for update;

  if current_invoice.id is null then
    if exists (
      select 1
      from public.user_progress progress
      where progress.user_id = auth.uid()
        and progress.payment_status in ('paid', 'verified')
    ) then
      return;
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
      auth.uid(),
      generated_number,
      default_amount,
      'IDR',
      'Pemetaan Potensi Harunokaze',
      'issued',
      null,
      now(),
      null,
      null
    )
    on conflict (user_id) do nothing
    returning * into current_invoice;

    if current_invoice.id is null then
      select *
      into current_invoice
      from public.assessment_invoices invoice
      where invoice.user_id = auth.uid()
      for update;
    end if;
  elsif current_invoice.status <> 'paid' then
    if exists (
      select 1
      from public.user_progress progress
      where progress.user_id = auth.uid()
        and progress.payment_status in ('paid', 'verified')
    ) then
      return query
      select
        current_invoice.id,
        current_invoice.invoice_number,
        current_invoice.amount,
        current_invoice.currency,
        current_invoice.description,
        current_invoice.status,
        current_invoice.due_date,
        current_invoice.issued_at,
        current_invoice.paid_at;
      return;
    end if;

    select exists (
      select 1
      from public.payments payment
      where payment.invoice_id = current_invoice.id
        and payment.status = 'pending'
        and payment.provider = 'pivot'
        and payment.created_at > now() - interval '15 minutes'
    )
    into has_active_payment;

    -- Preserve the admin-selected amount. Only reopen a cancelled invoice
    -- when there is no active Pivot session.
    if not has_active_payment then
      update public.assessment_invoices invoice
      set
        amount = case
          when current_invoice.amount >= 1000 then current_invoice.amount
          else default_amount
        end,
        currency = 'IDR',
        status = 'issued',
        paid_at = null,
        issued_at = case
          when current_invoice.status = 'cancelled' then now()
          else current_invoice.issued_at
        end,
        updated_at = now()
      where invoice.id = current_invoice.id;

      select *
      into current_invoice
      from public.assessment_invoices invoice
      where invoice.id = current_invoice.id;
    end if;
  end if;

  return query
  select
    current_invoice.id,
    current_invoice.invoice_number,
    current_invoice.amount,
    current_invoice.currency,
    current_invoice.description,
    current_invoice.status,
    current_invoice.due_date,
    current_invoice.issued_at,
    current_invoice.paid_at;
end;
$$;

revoke all on function public.ensure_own_assessment_invoice() from public;
grant execute on function public.ensure_own_assessment_invoice() to authenticated;

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

  if p_amount is null or p_amount < 1000 or p_amount > 100000000 then
    raise exception 'invoice amount must be between Rp1.000 and Rp100.000.000';
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
         and payment.provider = 'pivot'
         and payment.created_at > now() - interval '15 minutes'
     ) then
    raise exception 'invoice has an active Pivot payment session; wait until it expires before changing amount';
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
