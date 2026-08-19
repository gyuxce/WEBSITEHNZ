-- Fix PL/pgSQL output-column ambiguity while a psychologist saves a PAPI review.

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
    on conflict on constraint assessment_final_reviews_user_id_key do update set
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

    update public.user_progress as progress
    set
      final_review_status = case
        when progress.final_review_status = 'approved' then 'approved'
        else 'pending_qc'
      end,
      result_status = case
        when progress.final_review_status = 'approved' then 'completed'
        else 'available'
      end,
      updated_at = now()
    where progress.user_id = p_user_id;
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

notify pgrst, 'reload schema';
