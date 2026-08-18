-- Separate psychologist access from admin-only payment and certificate operations.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('participant', 'admin', 'psychologist'));

create or replace function public.is_psychologist()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'psychologist'
  );
$$;

create or replace function public.is_assessment_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or public.is_psychologist();
$$;

create or replace function public.can_review_assessment()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or public.is_psychologist();
$$;

revoke all on function public.is_psychologist() from public;
grant execute on function public.is_psychologist() to authenticated;

revoke all on function public.is_assessment_staff() from public;
grant execute on function public.is_assessment_staff() to authenticated;

revoke all on function public.can_review_assessment() from public;
grant execute on function public.can_review_assessment() to authenticated;

-- Assessment read RPCs are available to admins and psychologists.
create or replace function public.admin_list_pimsleur_results()
returns table (
  id uuid,
  user_id uuid,
  score_section2 integer,
  score_section3 integer,
  score_section4 integer,
  score_section5 integer,
  score_section6 integer,
  score_verbal integer,
  score_audio integer,
  score_total integer,
  grade text,
  grade_label text,
  status_label text,
  recommendation text,
  duration_seconds integer,
  completed_at timestamptz,
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
  if not public.is_assessment_staff() then
    raise exception 'not authorized';
  end if;

  return query
  select
    r.id,
    r.user_id,
    r.score_section2,
    r.score_section3,
    r.score_section4,
    r.score_section5,
    r.score_section6,
    r.score_verbal,
    r.score_audio,
    r.score_total,
    r.grade,
    r.grade_label,
    r.status_label,
    r.recommendation,
    r.duration_seconds,
    r.completed_at,
    coalesce(
      nullif(nullif(trim(p.full_name), ''), 'Peserta'),
      split_part(u.email, '@', 1),
      'Peserta'
    ) as full_name,
    u.email::text,
    p.whatsapp,
    p.city
  from public.pimsleur_results r
  left join public.profiles p on p.id = r.user_id
  left join auth.users u on u.id = r.user_id
  order by r.completed_at desc;
end;
$$;

create or replace function public.admin_get_pimsleur_detail(p_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  answers jsonb,
  score_section2 integer,
  score_section3 integer,
  score_section4 integer,
  score_section5 integer,
  score_section6 integer,
  score_verbal integer,
  score_audio integer,
  score_total integer,
  grade text,
  grade_label text,
  status_label text,
  recommendation text,
  duration_seconds integer,
  completed_at timestamptz,
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
  if not public.is_assessment_staff() then
    raise exception 'not authorized';
  end if;

  return query
  select
    r.id,
    r.user_id,
    r.answers,
    r.score_section2,
    r.score_section3,
    r.score_section4,
    r.score_section5,
    r.score_section6,
    r.score_verbal,
    r.score_audio,
    r.score_total,
    r.grade,
    r.grade_label,
    r.status_label,
    r.recommendation,
    r.duration_seconds,
    r.completed_at,
    coalesce(
      nullif(nullif(trim(p.full_name), ''), 'Peserta'),
      split_part(u.email, '@', 1),
      'Peserta'
    ) as full_name,
    u.email::text,
    p.whatsapp,
    p.city
  from public.pimsleur_results r
  left join public.profiles p on p.id = r.user_id
  left join auth.users u on u.id = r.user_id
  where r.user_id = p_user_id
  order by r.completed_at desc
  limit 1;
end;
$$;

create or replace function public.admin_list_cfit_results()
returns table (
  id uuid,
  user_id uuid,
  raw_subtest1 integer,
  raw_subtest2 integer,
  raw_subtest3 integer,
  raw_subtest4 integer,
  raw_total integer,
  iq integer,
  category text,
  age_years integer,
  age_months integer,
  norm_code text,
  duration_seconds integer,
  completed_at timestamptz,
  full_name text,
  email text,
  whatsapp text,
  city text,
  birth_date date
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_assessment_staff() then
    raise exception 'not authorized';
  end if;

  return query
  select
    r.id,
    r.user_id,
    r.raw_subtest1,
    r.raw_subtest2,
    r.raw_subtest3,
    r.raw_subtest4,
    r.raw_total,
    r.iq,
    r.category,
    r.age_years,
    r.age_months,
    r.norm_code,
    r.duration_seconds,
    r.completed_at,
    coalesce(
      nullif(nullif(trim(p.full_name), ''), 'Peserta'),
      split_part(u.email, '@', 1),
      'Peserta'
    ) as full_name,
    u.email::text,
    p.whatsapp,
    p.city,
    p.birth_date
  from public.cfit_results r
  left join public.profiles p on p.id = r.user_id
  left join auth.users u on u.id = r.user_id
  order by r.completed_at desc;
end;
$$;

create or replace function public.admin_get_cfit_detail(p_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  answers jsonb,
  raw_subtest1 integer,
  raw_subtest2 integer,
  raw_subtest3 integer,
  raw_subtest4 integer,
  raw_total integer,
  iq integer,
  category text,
  age_years integer,
  age_months integer,
  norm_code text,
  duration_seconds integer,
  completed_at timestamptz,
  full_name text,
  email text,
  whatsapp text,
  city text,
  birth_date date
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_assessment_staff() then
    raise exception 'not authorized';
  end if;

  return query
  select
    r.id,
    r.user_id,
    r.answers,
    r.raw_subtest1,
    r.raw_subtest2,
    r.raw_subtest3,
    r.raw_subtest4,
    r.raw_total,
    r.iq,
    r.category,
    r.age_years,
    r.age_months,
    r.norm_code,
    r.duration_seconds,
    r.completed_at,
    coalesce(
      nullif(nullif(trim(p.full_name), ''), 'Peserta'),
      split_part(u.email, '@', 1),
      'Peserta'
    ) as full_name,
    u.email::text,
    p.whatsapp,
    p.city,
    p.birth_date
  from public.cfit_results r
  left join public.profiles p on p.id = r.user_id
  left join auth.users u on u.id = r.user_id
  where r.user_id = p_user_id
  order by r.completed_at desc
  limit 1;
end;
$$;

create or replace function public.admin_list_papikostik_results()
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
  if not public.is_assessment_staff() then
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
  order by r.completed_at desc;
end;
$$;

create or replace function public.admin_get_papikostik_detail(p_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  answers jsonb,
  scores jsonb,
  analyses jsonb,
  total_top integer,
  total_bottom integer,
  total_all integer,
  is_complete_pattern boolean,
  review_status text,
  psychologist_notes text,
  final_summary text,
  duration_seconds integer,
  completed_at timestamptz,
  reviewed_at timestamptz,
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
  if not public.is_assessment_staff() then
    raise exception 'not authorized';
  end if;

  return query
  select
    r.id,
    r.user_id,
    r.answers,
    r.scores,
    r.analyses,
    r.total_top,
    r.total_bottom,
    r.total_all,
    r.is_complete_pattern,
    r.review_status,
    r.psychologist_notes,
    r.final_summary,
    r.duration_seconds,
    r.completed_at,
    r.reviewed_at,
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
  where r.user_id = p_user_id
  order by r.completed_at desc
  limit 1;
end;
$$;

revoke all on function public.admin_list_pimsleur_results() from public;
grant execute on function public.admin_list_pimsleur_results() to authenticated;
revoke all on function public.admin_get_pimsleur_detail(uuid) from public;
grant execute on function public.admin_get_pimsleur_detail(uuid) to authenticated;
revoke all on function public.admin_list_cfit_results() from public;
grant execute on function public.admin_list_cfit_results() to authenticated;
revoke all on function public.admin_get_cfit_detail(uuid) from public;
grant execute on function public.admin_get_cfit_detail(uuid) to authenticated;
revoke all on function public.admin_list_papikostik_results() from public;
grant execute on function public.admin_list_papikostik_results() to authenticated;
revoke all on function public.admin_get_papikostik_detail(uuid) from public;
grant execute on function public.admin_get_papikostik_detail(uuid) to authenticated;

-- Controlled write path for psychologist interpretation. Payment and certificate RPCs
-- remain protected by is_admin() in their existing migrations.
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
begin
  if not public.can_review_assessment() then
    raise exception 'not authorized';
  end if;

  if nullif(trim(coalesce(p_notes, '')), '') is null then
    raise exception 'psychologist interpretation is required';
  end if;

  return query
  update public.papikostik_results
  set
    review_status = 'reviewed',
    psychologist_notes = trim(p_notes),
    reviewed_at = now()
  where public.papikostik_results.user_id = p_user_id
  returning
    public.papikostik_results.user_id,
    public.papikostik_results.review_status,
    public.papikostik_results.psychologist_notes,
    public.papikostik_results.reviewed_at;

  if not found then
    raise exception 'PAPI Kostick result not found';
  end if;
end;
$$;

revoke all on function public.psychologist_save_papikostik_review(uuid, text) from public;
grant execute on function public.psychologist_save_papikostik_review(uuid, text) to authenticated;
