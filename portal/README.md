# Harunokaze Portal — Pemetaan Potensi

Portal web calon siswa untuk daftar, bayar, tes, dan unduh sertifikat pemetaan potensi.

**Stack:** React 19 + Vite + TypeScript + Tailwind v4 + Supabase + Pivot Payment

## Fitur MVP

- Register / login / logout / lupa password
- Dashboard progress pemetaan
- Pembayaran pemetaan (Pivot Payment + mode sandbox dev)
- **Tes Pimsleur** (aptitude bahasa, seksi 2–6, timer 25 menit, grade A–F)
- Hasil Pimsleur + admin daftar/detail skor
- CFIT: 4 subtes, instruksi dari PPTX, timer per subtes, gambar soal, penyimpanan jawaban, raw score per subtes, raw total, IQ, kategori, halaman hasil peserta, dan admin detail jawaban berdasarkan norma CFIT 3A
- PAPI Kostick: 90 soal forced-choice, scoring 20 faktor, status hasil peserta, dan admin detail + review psikolog/admin
- Review final admin: interpretasi psikolog, narasi peserta hasil QC, persetujuan final, dan penerbitan sertifikat
- Legacy sertifikat HTML masih ada di `/result/legacy`

## Setup

### 1. Supabase

1. Buat project di [supabase.com](https://supabase.com)
2. **Pastikan project tidak paused** — kalau ada banner "Project is paused", klik **Restore project** dulu
3. Buka **SQL Editor** → paste & jalankan isi file (berurutan):
   - `supabase/migrations/20260720000000_initial_schema.sql`
   - `supabase/migrations/20260721000000_pimsleur_results.sql`
   - `supabase/migrations/20260722000000_cfit_papikostik_progress.sql`
   - `supabase/migrations/20260723000000_cfit_low_score_floor.sql`
   - `supabase/migrations/20260724000000_papikostik_results.sql`
   - `supabase/migrations/20260731000000_certificate_admin_unlock.sql`
   - `supabase/migrations/20260803000000_final_review_workflow.sql`
   - `supabase/migrations/20260803000001_final_review_guardrails.sql`

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

#### Format soal legacy

Tes Pimsleur, CFIT, dan PAPI Kostick sudah memakai data lokal di source code. Tabel
`test_questions` hanya tersisa untuk flow legacy/generic.

Contoh struktur data:

```sql
insert into public.test_questions
  (test_type, question_text, options, correct_answer, order_index, active)
values
  (
    'cfit',
    'ISI_SOAL_RESMI_DI_SINI',
    '[{"label":"A","value":"a"},{"label":"B","value":"b"},{"label":"C","value":"c"},{"label":"D","value":"d"}]'::jsonb,
    'a',
    1,
    true
  );
```

Untuk PAPI Kostick, sistem menyimpan jawaban, skor faktor, interpretasi dasar, dan status review
ke tabel `papikostik_results`.

### 2. Environment

```bash
cp .env.example .env
```

Isi `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_PEMETAAN_PRICE=150000
VITE_LANDING_URL=http://localhost:5173
```

### 3. Pivot Payment Edge Functions

Deploy ke Supabase:

```bash
supabase functions deploy pivot-create
supabase functions deploy pivot-webhook
```

Set secrets di Supabase Dashboard → Edge Functions:

- `PIVOT_BASE_URL=https://api-stg.pivot-payment.com`
- `PIVOT_CLIENT_ID`
- `PIVOT_CLIENT_SECRET`
- `PIVOT_CALLBACK_API_KEY`
- `PIVOT_PAYMENT_AMOUNT=150000`
- `PIVOT_SUCCESS_URL`
- `PIVOT_FAILURE_URL`
- `PIVOT_EXPIRATION_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Callback URL Pivot: `https://xxxx.supabase.co/functions/v1/pivot-webhook`

Gunakan kredensial Sandbox sampai alur pembayaran dan callback berhasil diverifikasi.

### 4. Database payment metadata

Portal menggunakan Pivot Payment Session mode `REDIRECT`. Jalankan migration berikut di Supabase SQL
Editor:

```text
supabase/migrations/20260730000000_pivot_payment.sql
```

Deploy functions:

```bash
supabase functions deploy pivot-create
supabase functions deploy pivot-webhook
```

Set secrets di Supabase Edge Functions:

```text
PIVOT_BASE_URL=https://api-stg.pivot-payment.com
PIVOT_CLIENT_ID=<Client ID Sandbox>
PIVOT_CLIENT_SECRET=<Client Secret Sandbox>
PIVOT_CALLBACK_API_KEY=<Callback API Key Sandbox>
PIVOT_PAYMENT_AMOUNT=150000
PIVOT_SUCCESS_URL=https://portal.harunokaze.id/payment?payment=success
PIVOT_FAILURE_URL=https://portal.harunokaze.id/payment?payment=failure
PIVOT_EXPIRATION_URL=https://portal.harunokaze.id/payment?payment=expired
```

Callback URL yang didaftarkan di Pivot Dashboard → Settings → Developer Settings → Callbacks:

```text
https://<PROJECT_REF>.supabase.co/functions/v1/pivot-webhook
```

### 5. Jalankan

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
    pages/          Login, Register, Dashboard, Payment, Tests, Result, Admin Review
    components/     Layout, ProgressSteps, ProtectedRoute
    contexts/       AuthContext
    lib/            Supabase client + types
  supabase/
    migrations/     Schema SQL
    functions/      Pivot create + webhook
```

## Production

- Deploy portal ke Vercel/Netlify (build: `npm run build`, output: `dist/`)
- Set env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PEMETAAN_PRICE`
- Di landing, set `VITE_PORTAL_URL=https://portal.harunokaze.id`
