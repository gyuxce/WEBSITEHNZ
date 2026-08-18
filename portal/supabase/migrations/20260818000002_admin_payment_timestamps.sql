-- Expose participant registration time to the admin payment dashboard.
-- paid_at remains the source of truth for the successful payment time.

drop function if exists public.admin_list_assessment_invoices();

create function public.admin_list_assessment_invoices()
returns table (
  user_id uuid,
  full_name text,
  email text,
  whatsapp text,
  city text,
  registered_at timestamptz,
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
    u.created_at,
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
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_assessment_invoices() from public;
grant execute on function public.admin_list_assessment_invoices() to authenticated;
