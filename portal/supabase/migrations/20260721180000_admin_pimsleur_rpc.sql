-- Admin overview: join hasil + profil + email tanpa terhalang RLS
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
  if not public.is_admin() then
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

revoke all on function public.admin_list_pimsleur_results() from public;
grant execute on function public.admin_list_pimsleur_results() to authenticated;

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
  if not public.is_admin() then
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

revoke all on function public.admin_get_pimsleur_detail(uuid) from public;
grant execute on function public.admin_get_pimsleur_detail(uuid) to authenticated;
