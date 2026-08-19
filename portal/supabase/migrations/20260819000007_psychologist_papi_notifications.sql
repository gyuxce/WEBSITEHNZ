-- Keep one auditable email notification for each participant's completed PAPI Kostick.
-- Delivery itself is handled by the server-side Edge Function using Resend.

create table if not exists public.psychologist_notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_type text not null default 'papikostik_completed'
    check (notification_type in ('papikostik_completed')),
  recipient_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint psychologist_notification_logs_user_type_key unique (user_id, notification_type)
);

drop trigger if exists psychologist_notification_logs_updated_at on public.psychologist_notification_logs;
create trigger psychologist_notification_logs_updated_at
  before update on public.psychologist_notification_logs
  for each row execute function public.set_updated_at();

alter table public.psychologist_notification_logs enable row level security;

drop policy if exists "Admins can view psychologist notification logs" on public.psychologist_notification_logs;
create policy "Admins can view psychologist notification logs"
  on public.psychologist_notification_logs for select
  using (public.is_admin());

