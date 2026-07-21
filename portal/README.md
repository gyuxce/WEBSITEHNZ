# Harunokaze Portal — Pemetaan Potensi

Portal web calon siswa untuk daftar, bayar, tes, dan unduh sertifikat pemetaan potensi.

**Stack:** React 19 + Vite + TypeScript + Tailwind v4 + Supabase + Midtrans Snap

## Fitur MVP

- Register / login / logout / lupa password
- Dashboard progress 6 langkah
- Pembayaran pemetaan (Midtrans + mode sandbox dev)
- **Tes Pimsleur** (aptitude bahasa, seksi 2–6, timer 25 menit, grade A–F)
- Hasil Pimsleur + admin daftar/detail skor
- Papikostik & CFIT: menyusul (belum dibuka)
- Legacy sertifikat HTML masih ada di `/result/legacy`

## Setup

### 1. Supabase

1. Buat project di [supabase.com](https://supabase.com)
2. **Pastikan project tidak paused** — kalau ada banner "Project is paused", klik **Restore project** dulu
3. Buka **SQL Editor** → paste & jalankan isi file (berurutan):
   - `supabase/migrations/20260720000000_initial_schema.sql`
   - `supabase/migrations/20260721000000_pimsleur_results.sql`

Untuk admin: set `profiles.role = 'admin'` pada user staf.

#### Error `cannot execute CREATE TABLE in a read-only transaction`?

Jalankan **query ini dulu** (Run terpisah), lalu ulangi migration:

```sql
SELECT pg_is_in_recovery() AS database_readonly;
SHOW default_transaction_read_only;
SET default_transaction_read_only = off;
```

| Hasil | Arti | Solusi |
|-------|------|--------|
| `pg_is_in_recovery = true` | DB read-only | Project paused → **Restore** di dashboard |
| Project paused / sleep | Free tier tidak aktif | Dashboard → **Restore project** |
| Masih error | Branch/pooler issue | Buat **project Supabase baru**, ulangi migration |

4. Di **Authentication → URL Configuration**, tambahkan:
   - Site URL: `http://localhost:5174`
   - Redirect URLs: `http://localhost:5174/reset-password`

### 2. Environment

```bash
cp .env.example .env
```

Isi `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
VITE_PEMETAAN_PRICE=150000
VITE_LANDING_URL=http://localhost:5173
```

### 3. Midtrans Edge Functions (opsional untuk production)

Deploy ke Supabase:

```bash
supabase functions deploy midtrans-create
supabase functions deploy midtrans-webhook
```

Set secrets di Supabase Dashboard → Edge Functions:

- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_IS_PRODUCTION=false`
- `SUPABASE_SERVICE_ROLE_KEY`

Webhook URL Midtrans: `https://xxxx.supabase.co/functions/v1/midtrans-webhook`

**Tanpa Midtrans:** gunakan tombol "Mode sandbox" di halaman pembayaran untuk simulasi lokal.

### 4. Jalankan

```bash
cd portal
npm install
npm run dev
```

Buka http://localhost:5174

Landing page (terminal terpisah):

```bash
cd ..
npm run dev
```

Buka http://localhost:5173 — tombol "Mulai Pemetaan" mengarah ke portal.

## Struktur

```
portal/
  src/
    pages/          Login, Register, Dashboard, Payment, Tests, Result
    components/     Layout, ProgressSteps, ProtectedRoute
    contexts/       AuthContext
    lib/            Supabase client + types
  supabase/
    migrations/     Schema SQL
    functions/      Midtrans create + webhook
```

## Production

- Deploy portal ke Vercel/Netlify (build: `npm run build`, output: `dist/`)
- Set env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MIDTRANS_CLIENT_KEY`
- Di landing, set `VITE_PORTAL_URL=https://portal.harunokaze.id`
