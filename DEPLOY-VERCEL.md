# Deploy Vercel — Landing + Portal

Repo ini punya **2 project Vercel** dari satu GitHub repo.

## Project 1: Landing (sudah ada)

| Setting | Nilai |
|---------|--------|
| URL Vercel | https://websitehnz.vercel.app |
| Domain custom | https://www.harunokaze.id |
| Root Directory | `/` (root) |
| Branch | `master` |

**Environment Variables** di Vercel → Settings → Environment Variables:

```
VITE_PORTAL_URL=https://portal.harunokaze.id
```

(Ganti jika portal pakai subdomain/URL Vercel lain.)

Setelah tambah env → **Redeploy** production.

---

## Project 2: Portal (buat baru)

| Setting | Nilai |
|---------|--------|
| Root Directory | **`portal`** |
| Branch | `master` |
| Domain custom (disarankan) | `portal.harunokaze.id` |

**Environment Variables:**

```
VITE_SUPABASE_URL=https://izzexlnrpwkjtqtvtcba.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key dari Supabase Dashboard>
VITE_PEMETAAN_PRICE=150000
VITE_LANDING_URL=https://www.harunokaze.id
VITE_MIDTRANS_CLIENT_KEY=
```

---

## Supabase Auth URLs

**Authentication** → **URL Configuration** — tambahkan semua domain portal:

```
https://portal.harunokaze.id
https://<nama-portal>.vercel.app
```

| Field | Nilai |
|-------|--------|
| Site URL | `https://portal.harunokaze.id` |
| Redirect URLs | `https://portal.harunokaze.id/reset-password` |

---

## Domain ganda (Vercel + custom)

Keduanya bisa aktif bersamaan:

- Landing: `websitehnz.vercel.app` **dan** `www.harunokaze.id`
- Portal: `xxx.vercel.app` **dan** `portal.harunokaze.id`

Pastikan env `VITE_PORTAL_URL` dan `VITE_LANDING_URL` pakai **domain utama** (custom domain), bukan URL Vercel.

---

## Cek setelah deploy

1. https://www.harunokaze.id → klik **Mulai Pemetaan** → harus ke portal `/register`
2. https://portal.harunokaze.id/register → daftar akun
3. Flow: bayar (sandbox) → tes → sertifikat
