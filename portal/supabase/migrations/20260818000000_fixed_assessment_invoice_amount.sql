-- Assessment mapping payment is temporarily fixed at Rp99.000.
-- Keep the admin invoice screen for monitoring and metadata, but do not allow
-- the amount to be changed from the client or by a custom RPC argument.

create or replace function public.assessment_invoice_default_amount()
returns integer
language sql
immutable
as $$
  select 99000;
$$;

revoke all on function public.assessment_invoice_default_amount() from public;
grant execute on function public.assessment_invoice_default_amount() to authenticated;

-- Normalize unpaid invoices that are not tied to an active payment session.
-- Paid invoices remain untouched as historical records.
update public.assessment_invoices invoice
set
  amount = public.assessment_invoice_default_amount(),
  currency = 'IDR',
  updated_at = now()
where invoice.status = 'issued'
  and invoice.amount is distinct from public.assessment_invoice_default_amount()
  and not exists (
    select 1
    from public.user_progress progress
    where progress.user_id = invoice.user_id
      and progress.payment_status in ('paid', 'verified')
  )
  and not exists (
    select 1
    from public.payments payment
    where payment.invoice_id = invoice.id
      and payment.status in ('pending', 'settlement')
  );

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
    from public.profiles
    where id = auth.uid()
      and role = 'participant'
  ) then
    raise exception 'participant not found';
  end if;

  select *
  into current_invoice
  from public.assessment_invoices
  where user_id = auth.uid()
  for update;

  if current_invoice.id is null then
    -- Legacy participants with verified access must not receive a second invoice.
    if exists (
      select 1
      from public.user_progress
      where user_id = auth.uid()
        and payment_status in ('paid', 'verified')
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

    -- Another request may have won the unique user_id race.
    if current_invoice.id is null then
      select *
      into current_invoice
      from public.assessment_invoices
      where user_id = auth.uid()
      for update;
    end if;
  elsif current_invoice.status <> 'paid' then
    -- Preserve legacy or already-verified access if the invoice record is stale.
    if exists (
      select 1
      from public.user_progress
      where user_id = auth.uid()
        and payment_status in ('paid', 'verified')
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
      from public.payments
      where invoice_id = current_invoice.id
        and status = 'pending'
        and created_at > now() - interval '15 minutes'
    )
    into has_active_payment;

    -- Do not rewrite an invoice while its provider session is still active.
    if not has_active_payment then
      update public.assessment_invoices
      set
        amount = default_amount,
        currency = 'IDR',
        status = 'issued',
        paid_at = null,
        issued_at = case
          when current_invoice.status = 'cancelled' then now()
          else issued_at
        end,
        updated_at = now()
      where id = current_invoice.id;

      select *
      into current_invoice
      from public.assessment_invoices
      where id = current_invoice.id;
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

-- Keep the RPC signature for the existing admin UI, but enforce the fixed price
-- server-side even if someone calls the RPC outside the UI.
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
  default_amount integer := public.assessment_invoice_default_amount();
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_amount is distinct from default_amount then
    raise exception 'assessment invoice amount is fixed at Rp99.000';
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
     and existing_invoice.amount is distinct from default_amount
     and exists (
       select 1
       from public.payments payment
       where payment.invoice_id = existing_invoice.id
         and payment.status = 'pending'
         and payment.created_at > now() - interval '15 minutes'
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
    default_amount,
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
