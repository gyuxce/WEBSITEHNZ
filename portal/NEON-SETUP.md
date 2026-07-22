# Migrasi ke Neon (ringkas)

1. Buat DB Neon → jalankan `db/schema.sql`
2. Isi env (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`)
3. Deploy Vercel (root `portal/`) + set env production
4. Midtrans webhook → `https://<domain>/api/payments/midtrans/webhook`
5. Daftar user baru (data Supabase lama tidak otomatis pindah)
6. Promosikan admin: `update profiles set role='admin' where id='...'`
