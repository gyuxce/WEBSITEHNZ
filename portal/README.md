# Harunokaze Portal — Pemetaan Potensi

Portal web calon siswa: daftar, bayar, tes Pimsleur + CFIT, hasil.

**Stack:** React 19 + Vite + TypeScript + Tailwind v4 + **Neon Postgres** + **Better Auth** + **Hono API** + Midtrans Snap

## Fitur

- Register / login / logout / lupa password (Better Auth)
- Dashboard progress (bayar → Pimsleur → CFIT → Papikostik)
- Pembayaran pemetaan (Midtrans + sandbox)
- Tes Pimsleur + admin daftar/detail
- Tes CFIT 3A (timer, IQ norma, kategori merah/kuning/hijau)
- Papikostik: placeholder (menyusul)

## Setup Neon

1. Buat project di [console.neon.tech](https://console.neon.tech)
2. Copy **connection string** → `DATABASE_URL`
3. Di Neon SQL Editor, jalankan seluruh isi:
   - `db/schema.sql`
4. (Opsional) jadikan admin:
   ```sql
   update public.profiles set role = 'admin' where id = '<user-id>';
   ```

## Environment

```bash
cp .env.example .env
```

Isi minimal:

```env
DATABASE_URL=postgresql://...@...neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=<random-min-32-chars>
BETTER_AUTH_URL=http://localhost:5174
VITE_APP_URL=http://localhost:5174
VITE_PEMETAAN_PRICE=150000
VITE_LANDING_URL=http://localhost:5173
```

Opsional Midtrans / email:

```env
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_IS_PRODUCTION=false
RESEND_API_KEY=re_...
```

## Local development

```bash
npm install
npm run dev
```

Menjalankan **API** di `:8787` + **Vite** di `:5174` (proxy `/api` → API).

## Vercel

- Root directory: `portal/`
- Build: `npm run build`
- Output: `dist`
- Env: samakan `.env.example` (`DATABASE_URL`, `BETTER_AUTH_*`, Midtrans, …)
- Set `BETTER_AUTH_URL` / `VITE_APP_URL` ke URL production portal
- Midtrans webhook: `https://<portal-domain>/api/payments/midtrans/webhook`

API di-serve dari `api/[[...route]].ts` (Hono + Node runtime).

## Migrasi dari Supabase

| Dulu | Sekarang |
|------|----------|
| Supabase Auth | Better Auth (`/api/auth/*`) |
| Supabase Postgres + RLS | Neon Postgres (auth di API) |
| Edge Functions Midtrans | `POST /api/payments/midtrans/*` |
| `VITE_SUPABASE_*` | `DATABASE_URL` + `BETTER_AUTH_*` |

Data lama di Supabase yang sleep **tidak ikut pindah otomatis** — peserta daftar ulang di Neon, atau export manual jika masih kebaca.

Folder `supabase/` dibiarkan sebagai arsip referensi; skema aktif ada di `db/schema.sql`.
