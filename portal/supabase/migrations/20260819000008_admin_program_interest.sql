-- Admin-only management for a participant's selected program interest.
-- Kept behind an RPC so psychologist and participant sessions cannot alter it.

drop function if exists public.admin_list_assessment_invoices();

create function public.admin_list_assessment_invoices()
returns table (
  user_id uuid,
  full_name text,
  email text,
  whatsapp text,
  city text,
  program_interest text,
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
    p.program_interest,
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

create or replace function public.admin_update_participant_program_interest(
  p_user_id uuid,
  p_program_interest text
)
returns table (
  user_id uuid,
  program_interest text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_program_interest is null
     or p_program_interest not in (
       'Pelatihan Bahasa & Karakter',
       'Program Bidang Konstruksi',
       'Program Perawatan & Jasa (Kaigo)',
       'Program Driver Jepang',
       'Belum yakin — butuh konsultasi'
     ) then
    raise exception 'invalid program interest';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = p_user_id
      and profile.role = 'participant'
  ) then
    raise exception 'participant not found';
  end if;

  return query
  update public.profiles profile
  set program_interest = p_program_interest
  where profile.id = p_user_id
  returning profile.id, profile.program_interest;
end;
$$;

revoke all on function public.admin_update_participant_program_interest(uuid, text) from public;
grant execute on function public.admin_update_participant_program_interest(uuid, text) to authenticated;

notify pgrst, 'reload schema';
