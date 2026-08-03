-- Keep legacy admin paths from bypassing final QC and certificate approval.

create or replace function public.protect_final_review_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = new.user_id and not public.is_admin() then
    if old.final_review_status = 'locked'
      and new.final_review_status = 'pending_psychologist'
      and new.language_test_status = 'completed'
      and new.cfit_test_status = 'completed'
      and new.papikostik_test_status = 'completed' then
      new.final_review_status := 'pending_psychologist';
    else
      new.final_review_status := old.final_review_status;
    end if;
    if old.result_status = 'completed' or new.result_status = 'completed' then
      new.result_status := old.result_status;
    end if;
  elsif public.is_admin()
    and new.final_review_status <> 'approved'
    and new.result_status = 'completed' then
    new.result_status := 'available';
  end if;
  return new;
end;
$$;

-- Existing records from the previous PAPI-only certificate flow must return to review.
update public.user_progress p
set
  result_status = 'available',
  final_review_status = case
    when p.language_test_status = 'completed'
      and p.cfit_test_status = 'completed'
      and p.papikostik_test_status = 'completed' then 'pending_psychologist'
    else 'locked'
  end,
  updated_at = now()
where p.result_status = 'completed'
  and p.final_review_status <> 'approved'
  and not exists (
    select 1
    from public.assessment_final_reviews r
    where r.user_id = p.user_id
      and r.status = 'approved'
  );

-- Saving a psychologist interpretation also marks the PAPI reading as reviewed.
create or replace function public.sync_papikostik_review_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(coalesce(new.psychologist_interpretation, '')), '') is not null then
    update public.papikostik_results
    set
      review_status = 'reviewed',
      reviewed_at = coalesce(reviewed_at, now())
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_papikostik_review_status on public.assessment_final_reviews;
create trigger sync_papikostik_review_status
  after insert or update of psychologist_interpretation on public.assessment_final_reviews
  for each row execute function public.sync_papikostik_review_status();
