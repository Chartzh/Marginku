# Marginku — AI Price-Tag Margin Alert

> Solusi AI untuk membantu pemilik warung kelontong & minimarket mandiri (UMKM) mendeteksi kebocoran margin akibat kenaikan harga modal supplier, secara real-time lewat foto nota dan label rak.
>
> Submisi COMPFEST 18 — AI Innovation Challenge (AIC), Tema Smart Commerce.

---

## 🎯 Problem

Pemilik warung kelontong sering tidak sadar bahwa harga jual di rak sudah tidak menguntungkan karena harga modal dari supplier naik hampir tiap minggu. Nota kertas dari supplier hanya ditumpuk di laci kasir karena pemilik sibuk melayani pembeli. Akibatnya barang terus terjual dengan harga lama — margin tipis, bahkan rugi.

## 💡 Solusi

1. **Scan Nota Supplier** — foto nota belanja → AI OCR mengekstrak nama barang & harga modal terbaru ke katalog.
2. **Scan Label Rak** — foto label harga (price tag) fisik di etalase.
3. **Margin Defense & Smart Rounding** — sistem menghitung margin aktif, mendeteksi potensi jual rugi, dan merekomendasikan harga baru yang dibulatkan realistis ke kelipatan Rp500 / Rp1.000.
4. **Human-in-the-Loop** — pemilik warung tetap memegang keputusan akhir: terima (*Accept*) atau sesuaikan (*Override*) rekomendasi harga.

## 🧠 Arsitektur AI

```
Foto Nota Supplier ─┐
                    ├─→ LLM Vision Engine (Gemini Flash Vision API)
Foto Label Rak    ──┘         │  Ekstraksi citra → JSON terstruktur
                              ▼
              2-Stage Product Matching
              Stage 1: RapidFuzz (fuzzy string matching)
              Stage 2: Fine-tuned Sentence Transformer (semantic embedding)
                              │
                              ▼
              Deterministic Math Engine (Python murni)
              Margin = ((Harga Rak − Harga Modal) / Harga Rak) × 100
              Target Price = Harga Modal / (1 − Target Margin)
                              │
                              ▼
              Rupiah Smart Rounding Engine + Margin Alert
              (pembulatan ke atas kelipatan Rp500 / Rp1.000)
```

**Prinsip utama:** semua kalkulasi angka (margin, target harga, pembulatan) diproses di kode Python murni — tidak pernah diserahkan ke LLM, untuk menghindari kesalahan aritmetika (halusinasi numerik).

## ⚙️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS + Shadcn/ui (PWA, mobile-first) |
| Backend | FastAPI + Python |
| AI/OCR | Google Gemini Flash Vision API |
| Matching | RapidFuzz + Sentence Transformer fine-tuned (`paraphrase-multilingual-MiniLM-L12-v2` → `marginku-product-matcher`) |
| Database & Auth | Supabase (PostgreSQL + Auth + Row Level Security) |
| Container | Docker + Docker Compose |

---

## 🚀 Cara Menjalankan (Docker Compose)

### Prerequisites

- Docker + Docker Compose terinstall
- Gemini API Key dari [aistudio.google.com](https://aistudio.google.com)
- Project Supabase aktif (lihat bagian **Setup Supabase** di bawah)

### 1. Clone repository

```bash
git clone https://github.com/USERNAME/marginku.git
cd marginku
```

### 2. Siapkan environment variables

**File `backend/.env`:**

```env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here
```

**File `frontend/.env`** (salin dari `frontend/.env.example`):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here
VITE_API_URL=http://localhost:8000
```

> Kedua kredensial Supabase didapat dari **Project Settings → API** di dashboard Supabase.
> `service_role` key hanya untuk backend (jangan pernah taruh di frontend).

### 3. Jalankan semua service

```bash
docker compose up --build
```

### 4. Akses aplikasi

| Service | URL |
|---|---|
| Frontend | http://localhost (atau http://localhost:5173, sesuai konfigurasi compose) |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## 🛠️ Cara Menjalankan Manual (Tanpa Docker)

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
bun install        # atau: npm install
bun run dev        # atau: npm run dev
```

Buka browser di **http://localhost:5173/**. Saran: buka DevTools (`F12` → `Ctrl+Shift+M`) untuk simulasi tampilan HP.

---

## 🗄️ Setup Supabase

Aplikasi membutuhkan 3 tabel berikut. Jalankan SQL ini di **Supabase SQL Editor**:

```sql
-- 1. Katalog produk hasil scan nota
CREATE TABLE katalog_produk (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  kategori TEXT DEFAULT 'Umum',
  harga_modal INTEGER NOT NULL,
  harga_jual INTEGER NOT NULL,
  satuan TEXT DEFAULT 'pcs',
  stok INTEGER DEFAULT 0,
  target_margin_persen FLOAT DEFAULT 20.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Riwayat audit perubahan harga
CREATE TABLE audit_harga (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  produk_id UUID REFERENCES katalog_produk(id) ON DELETE SET NULL,
  nama_produk TEXT,
  harga_lama INTEGER,
  harga_baru INTEGER,
  jenis TEXT CHECK (jenis IN ('scan_nota', 'scan_rak', 'manual')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Pengaturan toko per pengguna
CREATE TABLE settings_toko (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nama_toko TEXT DEFAULT 'Warung Saya',
  default_target_margin FLOAT DEFAULT 20.0,
  danger_threshold FLOAT DEFAULT 5.0,
  rounding_step INTEGER DEFAULT 500,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Setelah itu:

1. Aktifkan **Row Level Security (RLS)** pada ketiga tabel.
2. Buat policy `user_id = auth.uid()` untuk SELECT/INSERT/UPDATE/DELETE pada tiap tabel.
3. Di **Authentication → Providers**, aktifkan login **Email + Password** (matikan "Confirm email" untuk kemudahan demo).

---

## 🤖 Fine-tuning Model (Product Matching)

Model embedding di-fine-tune khusus untuk domain nama produk warung kelontong Indonesia, agar mampu mencocokkan variasi penulisan seperti `"Mie Goreng Indomie"` ↔ `"Indomie Goreng Ayam 85gr"`.

> **Catatan:** folder `backend/models/` tidak disertakan di repository (di-`gitignore` karena ukurannya besar). Model dapat diregenerasi dengan langkah berikut, atau sistem akan otomatis memakai base model sebagai fallback.

```bash
cd backend

# 1. Buat/regenerasi dataset pasangan nama produk (data/training_pairs.csv)
python scripts/generate_dataset.py

# 2. Fine-tune model (~10 menit di CPU) → tersimpan ke models/marginku-product-matcher
python scripts/finetune_model.py

# 3. Validasi hasil fine-tuning
python scripts/test_model.py
```

Contoh hasil fine-tuning:

| Pasangan Nama | Similarity (fine-tuned) | Similarity (base model) |
|---|---|---|
| "Mie Goreng Indomie" ↔ "Indomie Goreng Ayam 85gr" | 0.979 | 0.232 |
| "TEH ROCI" ↔ "teh Roci" | 0.982 | — |

---

## 📱 Cara Pakai Aplikasi

1. **Register / Login** — buat akun dengan email & password.
2. **Scan Nota Supplier** — unggah foto nota belanja; sistem mengekstrak item & harga modal ke katalog.
3. **Scan Label Rak** — unggah foto label harga di rak; sistem mencocokkan dengan katalog dan menghitung margin.
4. **Lihat Alert** — status margin ditampilkan dengan warna + ikon + teks eksplisit (*"Margin aman"*, *"Untung tipis"*, *"Jual rugi"*).
5. **Terima / Override** — terima rekomendasi harga baru atau atur harga manual; setiap perubahan tercatat di Riwayat Audit.

## 📂 Struktur Direktori

```
Marginku/
├── README.md               # Dokumentasi utama repository
├── PRODUCT.md              # Spesifikasi produk MVP & aturan bisnis
├── DESIGN.md               # Design system tokens
├── TechStack.md            # Alasan pemilihan stack teknologi
├── Context.md              # Project brief & arsitektur Hybrid AI
├── docker-compose.yml      # Orkestrasi frontend + backend
├── backend/                # API & pipeline AI (FastAPI + Python)
│   ├── main.py             # Entry point FastAPI
│   ├── api/routes.py       # Endpoint REST (scan nota, scan label, katalog)
│   ├── pipeline/           # OCR engine (Gemini Vision) & math engine
│   ├── matching/           # 2-stage product matcher (RapidFuzz + embedding)
│   ├── scripts/            # generate_dataset, finetune_model, test_model
│   ├── data/               # training_pairs.csv & sampel gambar uji
│   ├── auth.py             # Verifikasi JWT Supabase
│   ├── database.py         # Koneksi Supabase
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/               # Aplikasi web mobile (React + TypeScript + Vite)
    ├── src/
    │   ├── components/     # Scan Rak, Scan Nota, Katalog, Riwayat, Setelan
    │   ├── contexts/       # AuthContext (Supabase Auth)
    │   ├── lib/            # Math engine (margin & rounding), Supabase client
    │   ├── services/       # API client ke backend
    │   └── pages/          # AuthPage
    ├── .env.example
    ├── Dockerfile
    └── nginx.conf
```

## 👥 Tim

| Member | Peran | Fokus Utama |
|---|---|---|
| Member 1 | AI/Backend Lead | Pipeline AI backend, integrasi Gemini API, fine-tuning model, math engine |
| Member 2 | Frontend / UI-UX Lead | Antarmuka MVP (React), alur scan interaktif, design system |
| Member 3 | Data & QA Test Engineer | Pengumpulan dataset nota/label, pengujian fungsional, skenario demo |
| Member 4 | Product & Pitch Lead | Proposal penyisihan, pitch deck, analisis dampak bisnis |

---

*Dikembangkan untuk COMPFEST 18 — AI Innovation Challenge.*
