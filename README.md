# 🛒 Marginku — AI Price-Tag Margin Alert
> **Anti-Inflation Margin Defense untuk Warung Kelontong & Minimarket Mandiri (UMKM)**  
> *Kompetisi Smart Commerce — CompFest Fasilkom UI*

---

## 🎯 1. Masalah & Solusi Utama

### ⚠️ Masalah Nyata di Lapangan
Pemilik warung kelontong sering mengalami **kerugian tak disadari (*leleak*)** akibat inflasi harga supplier yang naik hampir tiap minggu (mi instan, minyak goreng, sabun, dll). 
Saat nota kertas belanja dari agen tiba, pemilik warung sibuk melayani pembeli sehingga nota hanya ditumpuk di laci. Mereka **tidak sempat mengecek nota satu per satu untuk memperbarui label harga fisik di rak etalase**. Akibatnya, barang terus terjual dengan harga modal lama—menghasilkan margin tipis atau bahkan rugi bandar.

### 💡 Solusi Marginku
**Marginku** adalah asisten proaktif berbasis Computer Vision & Financial Analytics yang mendeteksi selisih harga jual di rak etalase terhadap harga modal supplier secara *real-time*:

1. **Scan Nota Grosir:** Memfoto nota belanja supplier $\rightarrow$ AI OCR mengekstrak nama barang & harga modal terbaru.
2. **Scan Label Rak:** Memfoto label harga (*price tag*) fisik di etalase warung.
3. **Margin Defense & Smart Rounding:** AI menghitung margin aktif, mendeteksi potensi jual rugi, dan memberikan rekomendasi harga baru yang dibulatkan realistis ke kelipatan **Rp 500 / Rp 1.000**.

---

## 🎨 2. Standar UI/UX — Swiss Style / Warm Rationalism

Aplikasi dirancang menggunakan filosofi **Swiss Style & Functional Minimalism** (bebas dari AI slop, warna neon berkilau, atau efek blur yang mengganggu):

* **Warna Alamiah & Kontras Tinggi:** Warm Charcoal (`#131417`), Forest Green (`#16a34a`), dan Terracotta Red (`#dc2626`).
* **Tipografi Angka Tabular (`tabular-nums`):** Seluruh nominal Rupiah, persentase margin, dan stok tercetak sejajar dan presisi.
* **Mode Teks Besar (Easy Mode):** Pembesaran skala 114% & touch target $\ge 52\text{px}$ untuk aksesibilitas pemilik warung lanjut usia (50+ tahun).
* **Indikator *Triple-Redundancy*:** Setiap status ditandai oleh Latar Warna + Ikon Vektor SVG + Teks Eksplisit (*"Jual rugi"*, *"Untung tipis"*, *"Margin aman"*).

---

## 🚀 3. Panduan Jalankan Aplikasi di Komputer Tim

### Prasyarat
* **Node.js** v18+ (atau **Bun** v1.0+)
* Git

### Langkah Jalankan Frontend Lokal:

```bash
# 1. Pull kode terbaru
git pull origin main

# 2. Masuk ke folder frontend & install dependencies
cd frontend
bun install
# (Catatan: Jika tidak menggunakan Bun, pakai: npm install)

# 3. Jalankan Dev Server
bun run dev
# (Catatan: Jika tidak menggunakan Bun, pakai: npm run dev)
```

Buka browser di: **`http://localhost:5173/`**  
*(Saran: Buka DevTools `F12` $\rightarrow$ `Ctrl+Shift+M` untuk simulasi tampilan ponsel HP)*.

---

## 🔑 4. Environment Variables (`.env`)

Untuk menghubungkan API Key (misal: Gemini Vision API) atau Backend FastAPI lokal, buat file `.env` baru di dalam folder `frontend/`:

**File:** `frontend/.env`
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_BACKEND_URL=http://localhost:8000
```

---

## 👥 5. Struktur & Pembagian Peran Tim CompFest

| No | Peran / Anggota | Fokus Utama & Responsibilitas |
| :---: | :--- | :--- |
| **1** | **Member 1** *(Project Lead & AI/Backend)* | Pipeline AI Vision Gemini API, RapidFuzz text matching, dan Deterministic Math Engine. |
| **2** | **Member 2** *(Frontend / UI-UX Dev)* | Antarmuka PWA/Mobile MVP, Swiss Style System, dan alur scan interaktif. |
| **3** | **Member 3** *(Data & QA Test Engineer)* | Pengumpulan dataset nota/label fisik riil & pengujian skenario demo *fail-proof*. |
| **4** | **Member 4** *(Product & Pitch Lead)* | Dokumen proposal penyisihan, naskah pitch deck, dan analisis dampak bisnis. |

---

## 📂 6. Struktur Direktori Repository

```
Marginku/
├── README.md            # Dokumentasi Utama Repository
├── PRODUCT.md           # Spesifikasi Produk MVP & Aturan Bisnis
├── DESIGN.md            # Sistem Desain Swiss Style Tokens
├── TechStack.md         # Alasan & Pilihan Stack Teknologi
├── Context.md           # Project Brief & Arsitektur Sistem Hybrid AI
└── frontend/            # Aplikasi Web Mobile (React + TypeScript + Vite + Tailwind)
    ├── src/
    │   ├── components/  # Dashboard, Shelf Scan, Receipt Scan, Catalog, Settings
    │   ├── lib/         # Mathematical Engine (Margin calculation & rounding)
    │   └── data/        # Sample Mock Data
    ├── package.json
    └── vite.config.ts
```

---

## 🛠️ 7. Menjalankan via Docker (Optional Demo)

```bash
cd frontend
docker build -t marginku-frontend .
docker run -p 80:80 marginku-frontend
```

---
*Dikembangkan dengan penuh dedikasi untuk Kompetisi CompFest Fasilkom UI.*
