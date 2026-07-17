# Harunokaze — Website Resmi

Landing page modern untuk **Harunokaze**, ekosistem persiapan & pendampingan karier Jepang (SSW/TITP) yang bermitra resmi dengan LPK & SO Wiwitan Baru.

Dibangun dari referensi layout & copywriting `harunokaze-mockup.html`, dengan identitas brand merah–navy "sakura" yang sudah ada.

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 7](https://vite.dev/) — build tool
- [Tailwind CSS v4](https://tailwindcss.com/) — styling & design tokens
- [Framer Motion](https://motion.dev/) — scroll reveal & micro-interaksi
- [Lucide React](https://lucide.dev/) — icon set

## Struktur Proyek

```
src/
  components/     Navbar, Footer, Logo, SakuraField, Reveal, WhatsAppFab, dll.
  sections/       Setiap section halaman (Hero, Ecosystem, Journey, Programs, ...)
  data/           Konten & copywriting terpusat (content.ts)
  index.css       Tailwind theme tokens (warna brand, font, animasi)
```

## Menjalankan Secara Lokal

Prasyarat: Node.js 18+

```bash
npm install
npm run dev
```

Buka http://localhost:5173

## Build Production

```bash
npm run build
npm run preview
```

## Kustomisasi Konten

Hampir semua teks/section dikendalikan dari satu file: `src/data/content.ts`.
Ubah data di sana (nav, hero, program, FAQ, testimoni alumni, dll.) tanpa perlu menyentuh komponen.

## Sistem Warna

Didefinisikan sebagai design token Tailwind di `src/index.css`:

| Token | Nilai | Kegunaan |
|---|---|---|
| `brand-red` | `#E61935` | Aksen utama, CTA |
| `brand-navy` | `#0F2240` | Teks utama, section gelap |
| `brand-bg` | `#F8F9FA` | Latar terang |
| `brand-sakura` | `#FFB3C6` | Aksen dekoratif |
