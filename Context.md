# 📌 CONTEXT & PROJECT BRIEF: AI Price-Tag Margin Alert
 
> **Target Segment:** Pemilik Warung Kelontong & Minimarket Mandiri (UMKM)  
> **Tema:** Smart Commerce (Anti-Inflation Margin Defense)  

---

## 🎯 1. Ringkasan Masalah & Solusi (The Core Idea)

### Masalah Nyata di Lapangan
Pemilik warung kelontong sering mengalami **kerugian tak disadari (*leleak*)** akibat inflasi harga supplier yang naik hampir tiap minggu (misal: mi instan, sabun, minyak goreng). 

Saat nota kertas dari supplier datang, pemilik warung sibuk melayani pembeli sehingga nota hanya ditumpuk di laci kasir. Mereka **tidak sempat mengecek nota usang satu per satu untuk memperbarui harga di rak fisik**. Akibatnya, barang terus terjual dengan harga lama dengan margin yang sangat tipis, bahkan rugi bandar.

### Solusi Produk
**AI Price-Tag Margin Alert** adalah asisten proaktif berbasis Computer Vision & Analytics yang mendeteksi selisih harga jual di rak fisik terhadap harga modal supplier secara *real-time*.

* **Step 1 (Input Nota):** Pemilik warung memfoto nota kertas supplier. AI mengekstrak nama barang & harga modal terbaru via OCR, lalu menyimpannya ke database lokal.
* **Step 2 (Audit Rak):** Pemilik warung memfoto label harga (*price tag*) fisik di rak.
* **Step 3 (Core Inference & Recommendation):** AI mencocokkan nama barang, menghitung margin aktif, dan memberikan rekomendasi harga jual baru yang sudah dibulatkan secara realistis jika margin terdeteksi terlalu tipis.

---

## 🏗️ 2. Arsitektur Teknis Sistem (Hybrid AI Architecture)

Untuk lomba di Fasilkom UI, sistem menggunakan **Pendekatan Hybrid AI** (menggabungkan AI Vision, Algoritma Deterministik, dan Domain Logic):

[ Input Foto Nota / Label Rak ]
│
▼
┌────────────────────────────────────────────────────────┐
│ 1. LLM Vision Engine (Gemini 1.5 Flash API)            │
│    └─ Ekstraksi foto acak menjadi JSON Terstruktur     │
└──────────────────────────────┬─────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────┐
│ 2. 2-Stage Text Matching Engine                        │
│    ├─ Stage 1: Fast Fuzzy Search (RapidFuzz/Levenshtein)│
│    └─ Stage 2: Fallback Vector Embedding (Semantic)    │
└──────────────────────────────┬─────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────┐
│ 3. Deterministic Math Engine (Python Code)             │
│    ├─ Margin Aktif (%) = ((Price_Rak - Price_Modal) /  │
│    │                        Price_Rak) * 100           │
│    └─ Target Price = Price_Modal / (1 - Target_Margin) │
└──────────────────────────────┬─────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────┐
│ 4. Rupiah Smart Rounding Engine                        │
│    └─ Pembulatan ke atas kelipatan Rp500 / Rp1.000     │
└──────────────────────────────┬─────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────┐
│ 5. LLM Reasoning & Human-in-the-Loop Feedback Engine   │
│    └─ Generate Alert Text & Opsi Override Harga User   │
└────────────────────────────────────────────────────────┘


---

## 👥 3. Pembagian Kerja & Peran Tim (4 Anggota)

| No | Peran / Anggota | Fokus Utama & Responsibilitas | Luaran Utama (*Deliverables*) |
| :---: | :--- | :--- | :--- |
| **1** | **Member 1**<br>*(Project Lead & AI/Backend)* | Mengembangkan pipeline AI backend, integrasi Gemini API, algoritma *fuzzy matching*, dan skrip matematika margin. | Backend API Service (FastAPI/Flask), Skrip Pipeline AI & Matching |
| **2** | **Member 2**<br>*(Frontend / UI-UX Dev)* | Merancang antarmuka MVP (Web/Mobile), alur unggah foto nota/rak, tampilan *Margin Alert*, dan tombol interaktif *feedback* user. | Antarmuka Aplikasi MVP (Streamlit / React / Flutter) |
| **3** | **Member 3**<br>*(Data & QA Test Engineer)* | Mengumpulkan sampel foto nota & label rak riil, menguji akurasi OCR & matching, serta menyusun skenario demo *fail-proof*. | Dataset Sampel (10 Nota & 10 Label), Laporan Akurasi Matching |
| **4** | **Member 4**<br>*(Product & Pitch Lead)* | Menyusun naskah proposal penyisihan, slide presentasi, naskah narasi *problem-solution fit*, dan dampak bisnis. | Dokumen Proposal Penyisihan, Pitch Deck, Naskah Pitching |

---

## 🚀 4. Timeline & Roadmap Pengerjaan (7 Hari)

* **Hari 1–2 (Persiapan & Desain Data):**
  * Member 3 mengumpulkan 5–10 foto nota & label fisik asli.
  * Member 1 menetapkan JSON Schema output ekstraksi AI.
  * Member 2 membuat wireframe UI MVP.
  * Member 4 mulai menyusun outline proposal CompFest.
* **Hari 3–5 (Eksekusi AI, Frontend, & Proposal):**
  * Member 1 membangun skrip Gemini Vision + RapidFuzz + Math Engine.
  * Member 2 membuat UI untuk upload foto & tampilan alert.
  * Member 4 menyusun draf proposal teknis & bisnis.
  * Member 3 menguji akurasi ekstraksi dari dataset sampel.
* **Hari 6–7 (Integrasi, Finishing, & Review):**
  * Penggabungan Frontend & Backend secara *end-to-end*.
  * Penyempurnaan proposal dan penyiapan video/screenshot demo MVP.
  * *Final Review* keselarasan dokumen dengan kriteria penilaian CompFest Fasilkom UI.

---

## 💡 5. Catatan Penting & Key Success Factors

1. **Prinsip Single-Input MVP (Penyisihan):**
   Untuk tahap demo penyisihan, sistem cukup mensimulasikan pencocokan dari 1 foto label rak yang diunggah pengguna terhadap database lokal hasil scan nota sebelumnya agar demo berjalan cepat, stabil, dan bebas kerumitan teknis saat dinilai.
2. **Kalkulasi Matematika:** Jangan pernah menyerahkan kalkulasi perkalian/pembagian/pembulatan pada LLM. Semua perhitungan angka WAJIB diproses di kode Python murni.
3. **Human-in-the-Loop:** Sistem memberi rekomendasi, tetapi pemilik warung memiliki hak akses penuh untuk menerima (*Accept*) atau menyesuaikan (*Override*) harga sesuai dinamika pasar lokal.