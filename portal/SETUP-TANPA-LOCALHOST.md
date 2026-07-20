# Panduan isi .env (tanpa localhost)

Kalau laptop kantor **tidak bisa** `npm run dev` / localhost karena administrator, pakai **deploy online** (gratis) lalu isi `.env` dengan URL deploy.

---

## File yang perlu diisi

| File | Untuk apa |
|------|-----------|
| `portal/.env` | Portal calon siswa |
| `.env` (root) | Landing page → link ke portal |

Kedua file sudah dibuat dengan placeholder `ISI-...` — ganti dengan nilai asli kamu.

---

## 1. Isi `portal/.env`

Buka **Supabase** → **Settings** → **API**:

```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_MIDTRANS_CLIENT_KEY=                    # kosongkan dulu boleh
VITE_PEMETAAN_PRICE=150000
VITE_LANDING_URL=https://nama-landing.vercel.app
```

---

## 2. Isi `.env` di root (landing)

```env
VITE_PORTAL_URL=https://nama-portal.vercel.app
```

---

## 3. Supabase Auth (pakai URL deploy, bukan localhost)

**Authentication** → **URL Configuration**:

| Field | Contoh |
|-------|--------|
| Site URL | `https://nama-portal.vercel.app` |
| Redirect URLs | `https://nama-portal.vercel.app/reset-password` |

**Email provider:** matikan **Confirm email** dulu untuk testing cepat.

---

## 4. Deploy tanpa localhost (gratis)

### Portal → Vercel

1. Push repo ke GitHub (sudah ada)
2. [vercel.com](https://vercel.com) → Import project `WEBSITEHNZ`
3. **Root Directory:** `portal`
4. **Environment Variables** — copy isi `portal/.env` (semua `VITE_*`)
5. Deploy → dapat URL mis. `https://harunokaze-portal.vercel.app`

### Landing → Vercel (project terpisah atau monorepo)

1. Import repo yang sama
2. **Root Directory:** `/` (root)
3. Env: `VITE_PORTAL_URL` = URL portal dari langkah atas
4. Deploy

Setelah deploy, **update** kedua `.env` dengan URL Vercel yang asli.

---

## 5. Tes tanpa laptop (HP / browser kantor)

Buka di browser (tidak perlu localhost):

- Landing: `https://nama-landing.vercel.app`
- Portal daftar: `https://nama-portal.vercel.app/register`

Flow: Daftar → Login → Bayar (Mode sandbox) → Tes → Sertifikat

---

## Ringkasan

```
Supabase ✅ (sudah)
    ↓
Isi portal/.env + .env root
    ↓
Deploy Vercel (portal + landing)
    ↓
Update Supabase Auth URL ke URL Vercel
    ↓
Buka dari HP / browser — tanpa localhost
```

Midtrans bisa ditambah belakangan; untuk sekarang cukup **Mode sandbox** di halaman pembayaran portal.
