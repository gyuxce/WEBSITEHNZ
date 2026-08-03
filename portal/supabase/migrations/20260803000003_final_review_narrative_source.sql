-- Keep the psychologist interpretation and participant-facing narrative separate.
-- The legacy PAPI final_summary must not prefill the QC participant-summary field.

create or replace function public.admin_get_final_assessment(p_user_id uuid)
returns table (
  user_id uuid,
  full_name text,
  email text,
  whatsapp text,
  city text,
  pimsleur_score_total integer,
  pimsleur_grade text,
  cfit_raw_total integer,
  cfit_iq integer,
  cfit_category text,
  papi_total_all integer,
  papi_review_status text,
  review_id uuid,
  psychologist_interpretation text,
  participant_summary text,
  qc_notes text,
  final_review_status text,
  approved_at timestamptz,
  certificate_code text
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
    ) as full_name,
    u.email::text,
    p.whatsapp,
    p.city,
    ps.score_total,
    ps.grade,
    cr.raw_total,
    cr.iq,
    cr.category,
    pk.total_all,
    pk.review_status,
    fr.id,
    coalesce(fr.psychologist_interpretation, pk.psychologist_notes),
    fr.participant_summary,
    fr.qc_notes,
    coalesce(
      fr.status,
      case
        when ps.user_id is not null and cr.user_id is not null and pk.user_id is not null
          then 'pending_psychologist'
        else 'locked'
      end
    ),
    fr.approved_at,
    cert.certificate_code
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.pimsleur_results ps on ps.user_id = u.id
  left join public.cfit_results cr on cr.user_id = u.id
  left join public.papikostik_results pk on pk.user_id = u.id
  left join public.assessment_final_reviews fr on fr.user_id = u.id
  left join public.certificates cert on cert.user_id = u.id
  where u.id = p_user_id;
end;
$$;

revoke all on function public.admin_get_final_assessment(uuid) from public;
grant execute on function public.admin_get_final_assessment(uuid) to authenticated;
