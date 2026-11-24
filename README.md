# SIONNIME — Anime Zine

Web streaming anime bergaya zine. Data dari AniList, pemutar lewat iframe MegaPlay.
Dibangun dengan **Vite + Tailwind CSS 3 + JavaScript modular** (tanpa framework).

## Struktur

```
index.html            markup halaman
src/
  main.js             entry: impor CSS, font, modul, lalu jalankan app
  css/                tailwind.css, base.css, kstream.css, extras.css
  js/
    core/             config, state, utils, audio, api (AniList)
    ui/               ui (toast, modal, nav), cards, keyboard
    features/         home, browse, search, detail, watchlist,
                      history, episodes, player, nav
```

## Jalankan lokal

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # hasil di dist/
npm run preview
```

## Hosting (Cloudflare Pages, gratis)

1. Buka Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pilih repo ini.
3. Isi pengaturan build:
   - Framework preset: **Vite** (atau None)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Save and Deploy**. Setiap `git push` akan deploy ulang otomatis.

Situs statis sehingga panggilan ke AniList dan iframe MegaPlay tidak diblokir.
Alternatif: Netlify atau Vercel dengan pengaturan build yang sama.

## Catatan

- Data watchlist, riwayat, dan pengaturan suara disimpan di `localStorage` browser masing-masing.
- Semua fungsi modul dipasang ke `window` di `src/main.js` karena HTML memakai atribut `onclick`.
