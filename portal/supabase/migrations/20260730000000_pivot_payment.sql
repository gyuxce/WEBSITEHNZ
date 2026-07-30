-- Pivot payment metadata. Existing Midtrans rows remain compatible.
alter table public.payments
  add column if not exists provider text not null default 'midtrans',
  add column if not exists provider_reference_id text,
  add column if not exists payment_url text,
  add column if not exists raw_payload jsonb;

create index if not exists payments_provider_reference_id_idx
  on public.payments (provider, provider_reference_id);
