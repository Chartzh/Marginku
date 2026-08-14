# Tech Stack Decision — AI Price-Tag Margin Alert
**Lomba:** CompFest Fasilkom UI — Tema Smart Commerce (Anti-Inflation Margin Defense)

---

## Ringkasan Keputusan

| Layer | Pilihan |
|---|---|
| Frontend Framework | **React (Vite) + TypeScript** |
| Styling | **Tailwind CSS** |
| Component Library | **Shadcn/ui** |
| Delivery Target | **Mobile-First Web / PWA** |
| Containerization | **Docker + Docker Compose** |
| Backend | FastAPI (Python) |

---

## 1. Frontend: React (Vite) — bukan Next.js

**Alasan pilih Vite:**
- App ini internal tool untuk pemilik warung + demo ke juri, bukan public-facing content yang butuh SEO/SSR — fitur andalan Next.js jadi tidak terpakai.
- Setup dan hot-reload lebih cepat, penting untuk iterasi UI di hari-hari awal (timeline 7 hari).
- Dockerize lebih simpel: `npm run build` → serve static hasil build via Nginx. Next.js punya beberapa mode build (standalone/export/SSR) yang menambah kompleksitas Dockerfile.
- Setup PWA lebih straightforward lewat plugin `vite-plugin-pwa` (auto-generate manifest + service worker), dibanding konfigurasi PWA di Next.js yang lebih banyak langkah.

## 2. Styling & Komponen: Tailwind CSS + Shadcn/ui

- Shadcn/ui bukan dependency library biasa (beda dari MUI/Ant Design) — komponennya di-copy langsung ke project, jadi gampang dikustom cepat saat mepet deadline.
- Base-nya Tailwind + Radix UI, jadi aksesibilitas (keyboard nav, ARIA) sudah otomatis terhandle.
- Komponen yang relevan untuk app ini:
  - `Dialog` / `Sheet` → alert margin tipis
  - `Card` → list produk & harga
  - `Button` variants → aksi Accept / Override harga
  - `Table` → riwayat perbandingan harga modal vs rak

## 3. Mobile-First Web / PWA

- Akses kamera untuk foto nota & label rak cukup pakai `<input type="file" capture="environment">` atau `getUserMedia` — jalan langsung di browser HP, tanpa perlu app native.
- Installable ke homescreen HP lewat PWA manifest + service worker, tanpa proses submit ke Play Store/App Store.
- Cross-platform otomatis: jalan di Android maupun iOS selama ada browser, jadi juri bisa coba dari HP apa pun saat demo.

## 4. Docker

- Frontend dan backend masing-masing punya `Dockerfile` sendiri, digabung lewat `docker-compose.yml`.
- Development sehari-hari tetap jalan native (`npm run dev`, `uvicorn main:app --reload`) — Docker dipakai saat demo/deploy agar environment konsisten.
- Reviewer/juri tinggal `docker-compose up` tanpa perlu install Node/Python version tertentu secara manual — nilai plus untuk reproducibility teknis.

| Service | Container |
|---|---|
| Frontend (Vite) | Build static assets, serve via Nginx |
| Backend (FastAPI) | Install deps (RapidFuzz, dll), run via Uvicorn |
| Orchestration | `docker-compose.yml` menjalankan frontend + backend sekaligus |

---

## Stack Final

```
Frontend : React (Vite) + TypeScript + Tailwind CSS + Shadcn/ui
Delivery : Mobile-First Web (PWA)
Backend  : FastAPI (Python)
Deploy   : Docker + Docker Compose
```