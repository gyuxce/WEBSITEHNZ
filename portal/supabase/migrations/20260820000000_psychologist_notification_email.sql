-- Inbox for PAPI alerts can differ from the login email, and can list several addresses.

alter table public.profiles
  add column if not exists notification_email text;

alter table public.profiles
  drop constraint if exists profiles_notification_email_check;

alter table public.profiles
  add constraint profiles_notification_email_check
  check (
    notification_email is null
    or notification_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}(\s*,\s*[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})*$'
  );

notify pgrst, 'reload schema';
