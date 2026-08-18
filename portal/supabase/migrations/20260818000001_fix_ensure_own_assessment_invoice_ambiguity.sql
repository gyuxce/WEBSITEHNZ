-- Fix ambiguous column references in the fixed assessment invoice RPC.
-- This migration is required for databases that already ran the original
-- 20260818000000_fixed_assessment_invoice_amount.sql migration.

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
    -- Legacy participants with verified access must not receive a second invoice.
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

    -- Another request may have won the unique user_id race.
    if current_invoice.id is null then
      select *
      into current_invoice
      from public.assessment_invoices invoice
      where invoice.user_id = auth.uid()
      for update;
    end if;
  elsif current_invoice.status <> 'paid' then
    -- Preserve legacy or already-verified access if the invoice record is stale.
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
        and payment.created_at > now() - interval '15 minutes'
    )
    into has_active_payment;

    -- Do not rewrite an invoice while its provider session is still active.
    if not has_active_payment then
      update public.assessment_invoices invoice
      set
        amount = default_amount,
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
