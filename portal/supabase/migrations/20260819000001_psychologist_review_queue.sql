-- Psychologist work queue: save the PAPI interpretation and hand the case to admin QC.

create or replace function public.psychologist_list_review_queue()
returns table (
  id uuid,
  user_id uuid,
  total_top integer,
  total_bottom integer,
  total_all integer,
  is_complete_pattern boolean,
  review_status text,
  completed_at timestamptz,
  reviewed_at timestamptz,
  final_review_status text,
  full_name text,
  email text,
  whatsapp text,
  city text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_psychologist() then
    raise exception 'not authorized';
  end if;

  return query
  select
    r.id,
    r.user_id,
    r.total_top,
    r.total_bottom,
    r.total_all,
    r.is_complete_pattern,
    r.review_status,
    r.completed_at,
    r.reviewed_at,
    pgr.final_review_status,
    coalesce(
      nullif(nullif(trim(p.full_name), ''), 'Peserta'),
      split_part(u.email, '@', 1),
      'Peserta'
    ) as full_name,
    u.email::text,
    p.whatsapp,
    p.city
  from public.papikostik_results r
  left join public.profiles p on p.id = r.user_id
  left join auth.users u on u.id = r.user_id
  left join public.user_progress pgr on pgr.user_id = r.user_id
  order by
    case when r.review_status = 'pending' then 0 else 1 end,
    r.completed_at desc;
end;
$$;

revoke all on function public.psychologist_list_review_queue() from public;
grant execute on function public.psychologist_list_review_queue() to authenticated;

-- Keep the existing write path, while also creating/updating the final-review
-- draft so the admin QC screen can continue the same case without copying notes.
create or replace function public.psychologist_save_papikostik_review(
  p_user_id uuid,
  p_notes text
)
returns table (
  user_id uuid,
  review_status text,
  psychologist_notes text,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_result public.papikostik_results;
  final_status text;
begin
  if not public.can_review_assessment() then
    raise exception 'not authorized';
  end if;

  if nullif(trim(coalesce(p_notes, '')), '') is null then
    raise exception 'psychologist interpretation is required';
  end if;

  update public.papikostik_results
  set
    review_status = 'reviewed',
    psychologist_notes = trim(p_notes),
    reviewed_at = now()
  where public.papikostik_results.user_id = p_user_id
  returning * into saved_result;

  if not found then
    raise exception 'PAPI Kostick result not found';
  end if;

  -- Only move a participant into QC once all three assessment results exist.
  if exists (
    select 1
    from public.pimsleur_results ps
    join public.cfit_results cf on cf.user_id = ps.user_id
    join public.papikostik_results pk on pk.user_id = ps.user_id
    where ps.user_id = p_user_id
  ) then
    select case
      when fr.status = 'approved' then 'approved'
      else 'pending_qc'
    end
    into final_status
    from public.assessment_final_reviews fr
    where fr.user_id = p_user_id;

    final_status := coalesce(final_status, 'pending_qc');

    insert into public.assessment_final_reviews (
      user_id,
      psychologist_interpretation,
      status,
      approved_by,
      approved_at
    )
    values (p_user_id, trim(p_notes), final_status, null, null)
    on conflict (user_id) do update set
      psychologist_interpretation = excluded.psychologist_interpretation,
      status = case
        when assessment_final_reviews.status = 'approved' then 'approved'
        else 'pending_qc'
      end,
      approved_by = case
        when assessment_final_reviews.status = 'approved' then assessment_final_reviews.approved_by
        else null
      end,
      approved_at = case
        when assessment_final_reviews.status = 'approved' then assessment_final_reviews.approved_at
        else null
      end,
      updated_at = now();

    update public.user_progress
    set
      final_review_status = case
        when final_review_status = 'approved' then 'approved'
        else 'pending_qc'
      end,
      result_status = case
        when final_review_status = 'approved' then 'completed'
        else 'available'
      end,
      updated_at = now()
    where user_id = p_user_id;
  end if;

  return query
  select
    saved_result.user_id,
    saved_result.review_status,
    saved_result.psychologist_notes,
    saved_result.reviewed_at;
end;
$$;

revoke all on function public.psychologist_save_papikostik_review(uuid, text) from public;
grant execute on function public.psychologist_save_papikostik_review(uuid, text) to authenticated;
