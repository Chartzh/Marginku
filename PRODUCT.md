# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19, TypeScript, Vite, Tailwind CSS, Radix UI Primitives, Vite PWA

## Users

Pemilik warung kelontong dan pedagang UMKM ritel tradisional di Indonesia lintas generasi:
- **Generasi Senior (50+ tahun):** Membutuhkan keterbacaan teks besar, kontras tinggi, navigasi sederhana tanpa menu tersembunyi, dan instruksi dalam bahasa manusia sehari-hari (*"Untung Rp 500/barang"*).
- **Generasi Muda / Digital Natives:** Menuntut kecepatan respon, efisiensi tap, tampilan flat modern, dan alur kerja cepat.

## Product Purpose

**Marginku** adalah solusi *Smart Commerce (Anti-Inflation Margin Defense)* untuk UMKM warung kelontong. Aplikasi ini mengamankan margin keuntungan toko dari inflasi kenaikan harga kulakan grosir secara real-time dengan membandingkan harga modal struk dengan harga di rak toko, lalu merekomendasikan harga jual baru yang telah dibulatkan ke pecahan uang yang mudah dikembalikan (kelipatan Rp 500 / Rp 1.000).

## Positioning

Satu-satunya sistem perlindungan margin warung dengan prinsip *Single-Input MVP*:
- **Pencocokan Cerdas:** Membandingkan foto label rak fisik terhadap riwayat nota kulakan sebelumnya menggunakan OCR dan Fast Fuzzy Matching.
- **Kalkulasi Matematika Deterministik:** Semua perhitungan margin dan pembulatan diproses melalui logika matematika murni (bukan halusinasi angka AI).
- **Human-in-the-Loop Override:** Memberikan rekomendasi harga yang dapat langsung diterima (*Accept*) atau disesuaikan mandiri (*Override*) oleh pemilik warung.

## Operating Context

- Digunakan langsung di lokasi warung fisik (etalase, lorong rak, meja kasir).
- Pencahayaan bervariasi (lampu warung terang hingga temaram sore hari).
- Digunakan dengan satu tangan pada smartphone Android/iOS.
- Memerlukan kecepatan pemindaian dan konfirmasi dalam $\le 2$ tap.

## Capabilities and Constraints

- **Ekstraksi Nota & Label Rak:** Ekstraksi item nama produk dan harga dari foto struk belanja grosir & label harga rak.
- **2-Stage Text Matching:** Fuzzy Matching (RapidFuzz) dengan fallback normalisasi nama barang.
- **Smart Rupiah Rounding:** Pembulatan pintar ke atas pada kelipatan Rp 500 atau Rp 1.000 agar pedagang tidak memerlukan koin receh langka saat memberikan kembalian.
- **Multi-Generational Easy Mode:** Toggle instan pembesaran font & kontras ekstra tinggi untuk pemilik warung lanjut usia.
- **Offline / Local PWA Ready:** Dapat di-install ke home screen HP (*Progressive Web App*).

## Brand Commitments

- **Nama Produk:** Marginku (*Solusi Cerdas Pertahanan Margin Warung*)
- **Gaya Visual:** **Minimalis**, **Flat Design**, dan **Dark Mode Modern**.
- **Prinsip Warna:**
  - *Dark Canvas:* Slate-950 (`#090d16`) & Slate-900 (`#0f172a`) untuk latar belakang hemat daya & nyaman di mata.
  - *Functional Accents:* Emerald (`#10b981`) untuk status aman/rekomendasi, Rose (`#f43f5e`) untuk peringatan jual rugi/bahaya, Amber (`#f59e0b`) untuk margin tipis.
  - *Zero Slop:* Tanpa gradien berlebih, tanpa glow menyilaukan, tanpa card bersarang, menggunakan ikon vektor presisi (Lucide).

## Accessibility & Inclusion

- Standar kepatuhan WCAG AA untuk kontras teks minimum 4.5:1.
- Target sentuh tombol minimum $48\text{px}-56\text{px}$ untuk kemudahan tap jari orang tua.
- Angka harga diformat menggunakan *tabular numerals* (`tabular-nums`) agar sejajar dan mudah diperiksa.
- Label teks eksplisit mendampingi seluruh kode warna dan ikon status.

## Product Principles

1. **Simplicity First (Minimalis & Flat):** Antarmuka bersih tanpa elemen visual yang tidak memiliki fungsi langsung bagi bisnis warung.
2. **Deterministic Financial Integrity:** Tidak ada kompromi pada akurasi angka uang modal, harga rak, dan keuntungan.
3. **Human Control Supremacy:** AI memberi rekomendasi, tetapi keputusan akhir penetapan harga 100% milik pedagang.
4. **Inclusive for All Ages:** Dari pemula teknologi hingga pengguna mahir dapat mengoperasikan aplikasi dalam hitungan detik.
