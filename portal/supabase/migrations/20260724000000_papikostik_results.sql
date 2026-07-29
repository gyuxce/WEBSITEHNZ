-- PAPI Kostick results and admin review.

create table if not exists public.papikostik_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  analyses jsonb not null default '{}'::jsonb,
  total_top integer,
  total_bottom integer,
  total_all integer,
  is_complete_pattern boolean,
  duration_seconds integer,
  review_status text not null default 'pending',
  psychologist_notes text,
  final_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.papikostik_results
  add column if not exists scores jsonb not null default '{}'::jsonb,
  add column if not exists analyses jsonb not null default '{}'::jsonb,
  add column if not exists total_top integer,
  add column if not exists total_bottom integer,
  add column if not exists total_all integer,
  add column if not exists is_complete_pattern boolean,
  add column if not exists review_status text not null default 'pending',
  add column if not exists psychologist_notes text,
  add column if not exists final_summary text,
  add column if not exists reviewed_at timestamptz;

alter table public.papikostik_results
  drop constraint if exists papikostik_results_review_status_check;
alter table public.papikostik_results
  add constraint papikostik_results_review_status_check
    check (review_status in ('pending', 'reviewed'));

create unique index if not exists papikostik_results_user_id_unique
  on public.papikostik_results (user_id);
create index if not exists papikostik_results_completed_at_idx
  on public.papikostik_results (completed_at desc);

alter table public.papikostik_results enable row level security;

drop policy if exists "Users can view own papikostik results" on public.papikostik_results;
create policy "Users can view own papikostik results"
  on public.papikostik_results for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own papikostik results" on public.papikostik_results;
create policy "Users can insert own papikostik results"
  on public.papikostik_results for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins can update papikostik review" on public.papikostik_results;
create policy "Admins can update papikostik review"
  on public.papikostik_results for update
  using (public.is_admin())
  with check (public.is_admin());

update public.user_progress
set papikostik_test_status = case
  when papikostik_test_status = 'locked' and cfit_test_status = 'completed' then 'available'
  else papikostik_test_status
end
where cfit_test_status = 'completed';

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
  if not public.is_admin() then
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

revoke all on function public.admin_list_papikostik_results() from public;
grant execute on function public.admin_list_papikostik_results() to authenticated;

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
  if not public.is_admin() then
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

revoke all on function public.admin_get_papikostik_detail(uuid) from public;
grant execute on function public.admin_get_papikostik_detail(uuid) to authenticated;
