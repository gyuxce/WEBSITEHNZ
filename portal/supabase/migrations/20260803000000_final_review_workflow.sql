-- Manual psychologist review, internal QC, and certificate approval workflow.

alter table public.user_progress
  add column if not exists final_review_status text not null default 'locked';

alter table public.user_progress
  drop constraint if exists user_progress_final_review_status_check;
alter table public.user_progress
  add constraint user_progress_final_review_status_check
    check (final_review_status in ('locked', 'pending_psychologist', 'pending_qc', 'approved'));

create table if not exists public.assessment_final_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  psychologist_interpretation text,
  participant_summary text,
  qc_notes text,
  status text not null default 'pending_psychologist',
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_final_reviews_status_check
    check (status in ('pending_psychologist', 'pending_qc', 'approved'))
);

alter table public.assessment_final_reviews
  add column if not exists psychologist_interpretation text,
  add column if not exists participant_summary text,
  add column if not exists qc_notes text,
  add column if not exists status text not null default 'pending_psychologist',
  add column if not exists approved_by uuid references auth.users (id),
  add column if not exists approved_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.assessment_final_reviews
  drop constraint if exists assessment_final_reviews_status_check;
alter table public.assessment_final_reviews
  add constraint assessment_final_reviews_status_check
    check (status in ('pending_psychologist', 'pending_qc', 'approved'));

create index if not exists assessment_final_reviews_status_idx
  on public.assessment_final_reviews (status, updated_at desc);

alter table public.assessment_final_reviews enable row level security;

drop policy if exists "Admins can view final assessment reviews" on public.assessment_final_reviews;
create policy "Admins can view final assessment reviews"
  on public.assessment_final_reviews for select
  using (public.is_admin());

drop policy if exists "Admins can insert final assessment reviews" on public.assessment_final_reviews;
create policy "Admins can insert final assessment reviews"
  on public.assessment_final_reviews for insert
  with check (public.is_admin());

drop policy if exists "Admins can update final assessment reviews" on public.assessment_final_reviews;
create policy "Admins can update final assessment reviews"
  on public.assessment_final_reviews for update
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists assessment_final_reviews_updated_at on public.assessment_final_reviews;
create trigger assessment_final_reviews_updated_at
  before update on public.assessment_final_reviews
  for each row execute function public.set_updated_at();

-- Existing participants who completed all three tests enter the new review queue.
update public.user_progress p
set final_review_status = case
  when exists (
    select 1 from public.assessment_final_reviews r
    where r.user_id = p.user_id and r.status = 'approved'
  ) then 'approved'
  when p.language_test_status = 'completed'
    and p.cfit_test_status = 'completed'
    and p.papikostik_test_status = 'completed' then 'pending_psychologist'
  else p.final_review_status
end
where p.language_test_status = 'completed'
   or p.cfit_test_status = 'completed'
   or p.papikostik_test_status = 'completed';

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
    fr.psychologist_interpretation,
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

create or replace function public.admin_upsert_final_review(
  p_user_id uuid,
  p_psychologist_interpretation text,
  p_participant_summary text,
  p_qc_notes text
)
returns public.assessment_final_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_review public.assessment_final_reviews;
  next_status text;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if not exists (
    select 1
    from public.pimsleur_results ps
    join public.cfit_results cr on cr.user_id = ps.user_id
    join public.papikostik_results pk on pk.user_id = ps.user_id
    where ps.user_id = p_user_id
  ) then
    raise exception 'all assessments must be completed before final review';
  end if;

  next_status := case
    when nullif(trim(coalesce(p_psychologist_interpretation, '')), '') is null
      then 'pending_psychologist'
    else 'pending_qc'
  end;

  insert into public.assessment_final_reviews (
    user_id,
    psychologist_interpretation,
    participant_summary,
    qc_notes,
    status,
    approved_by,
    approved_at
  )
  values (
    p_user_id,
    nullif(trim(p_psychologist_interpretation), ''),
    nullif(trim(p_participant_summary), ''),
    nullif(trim(p_qc_notes), ''),
    next_status,
    null,
    null
  )
  on conflict (user_id) do update set
    psychologist_interpretation = excluded.psychologist_interpretation,
    participant_summary = excluded.participant_summary,
    qc_notes = excluded.qc_notes,
    status = case
      when assessment_final_reviews.status = 'approved' then 'approved'
      else excluded.status
    end,
    approved_by = case
      when assessment_final_reviews.status = 'approved' then assessment_final_reviews.approved_by
      else null
    end,
    approved_at = case
      when assessment_final_reviews.status = 'approved' then assessment_final_reviews.approved_at
      else null
    end,
    updated_at = now()
  returning * into saved_review;

  update public.user_progress
  set
    final_review_status = saved_review.status,
    result_status = case
      when saved_review.status = 'approved' then 'completed'
      else 'available'
    end,
    updated_at = now()
  where user_id = p_user_id;

  return saved_review;
end;
$$;

revoke all on function public.admin_upsert_final_review(uuid, text, text, text) from public;
grant execute on function public.admin_upsert_final_review(uuid, text, text, text) to authenticated;

create or replace function public.admin_publish_assessment(p_user_id uuid)
returns table (certificate_id uuid, certificate_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  review public.assessment_final_reviews;
  language_score integer;
  generated_code text;
  saved_certificate public.certificates;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select * into review
  from public.assessment_final_reviews
  where user_id = p_user_id;

  if not found then
    raise exception 'final review has not been created';
  end if;
  if nullif(trim(coalesce(review.psychologist_interpretation, '')), '') is null then
    raise exception 'psychologist interpretation is required';
  end if;
  if nullif(trim(coalesce(review.participant_summary, '')), '') is null then
    raise exception 'participant summary is required';
  end if;
  if not exists (
    select 1
    from public.pimsleur_results ps
    join public.cfit_results cr on cr.user_id = ps.user_id
    join public.papikostik_results pk on pk.user_id = ps.user_id
    where ps.user_id = p_user_id
  ) then
    raise exception 'all assessments must be completed before publishing';
  end if;

  select score_total into language_score
  from public.pimsleur_results
  where user_id = p_user_id;

  generated_code := 'HNZ-' || to_char(now(), 'YYYY') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  select * into saved_certificate
  from public.certificates
  where user_id = p_user_id;

  if found then
    update public.certificates
    set
      score = coalesce(language_score, 0),
      recommendation = review.participant_summary
    where user_id = p_user_id
    returning * into saved_certificate;
  else
    insert into public.certificates (
      user_id,
      certificate_code,
      score,
      recommendation
    )
    values (
      p_user_id,
      generated_code,
      coalesce(language_score, 0),
      review.participant_summary
    )
    returning * into saved_certificate;
  end if;

  update public.assessment_final_reviews
  set
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = now(),
    updated_at = now()
  where user_id = p_user_id;

  update public.user_progress
  set
    final_review_status = 'approved',
    result_status = 'completed',
    updated_at = now()
  where user_id = p_user_id;

  return query select saved_certificate.id, saved_certificate.certificate_code;
end;
$$;

revoke all on function public.admin_publish_assessment(uuid) from public;
grant execute on function public.admin_publish_assessment(uuid) to authenticated;

-- Participants can see only a safe status projection, not psychologist notes.
drop policy if exists "Users can view own papikostik results" on public.papikostik_results;
drop policy if exists "Admins can view papikostik results" on public.papikostik_results;
create policy "Admins can view papikostik results"
  on public.papikostik_results for select
  using (public.is_admin());

create or replace function public.get_own_papikostik_status()
returns table (
  total_all integer,
  completed_at timestamptz,
  review_status text,
  final_summary text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pk.total_all,
    pk.completed_at,
    case
      when fr.status = 'approved' then 'approved'
      when pk.review_status = 'reviewed' then 'reviewed'
      else pk.review_status
    end as review_status,
    case
      when fr.status = 'approved' then fr.participant_summary
      else null
    end as final_summary
  from public.papikostik_results pk
  left join public.assessment_final_reviews fr on fr.user_id = pk.user_id
  where pk.user_id = auth.uid()
  order by pk.completed_at desc
  limit 1;
$$;

revoke all on function public.get_own_papikostik_status() from public;
grant execute on function public.get_own_papikostik_status() to authenticated;

-- Prevent a participant from marking their own final review or certificate complete.
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
  end if;
  return new;
end;
$$;

drop trigger if exists protect_final_review_progress on public.user_progress;
create trigger protect_final_review_progress
  before update on public.user_progress
  for each row execute function public.protect_final_review_progress();

drop policy if exists "Users can insert own certificates" on public.certificates;

-- Only admins can manage issued certificates from the final review flow.
drop policy if exists "Admins can manage certificates" on public.certificates;
create policy "Admins can manage certificates"
  on public.certificates for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users can insert own papikostik results" on public.papikostik_results;
create policy "Users can insert own papikostik results"
  on public.papikostik_results for insert
  with check (
    auth.uid() = user_id
    and review_status = 'pending'
    and psychologist_notes is null
    and final_summary is null
  );
