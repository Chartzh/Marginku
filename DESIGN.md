# Design System

<!-- impeccable:design-schema 1 -->

## Visual World: Utilitarian Flat Dark (Natural Retail POS)

- **Philosophy:** Minimalis, Flat Design, Natural Retail Colors, High-Utility, Multi-Generational.
- **Intent:** Menghilangkan semua warna neon AI artifisial, gradien pudar, dan efek kosmetik yang tidak alami. Menggunakan palet warm charcoal dan forest green terinspirasi aplikasi kasir ritel nyata (GoBiz / BukuWarung / Square).

## Color Tokens & Natural Palette

- **Warm Dark Canvas Surfaces:**
  - `bg-[#131417]` (Warm Charcoal Base): Latar belakang utama yang hangat dan tidak menyilaukan mata di warung.
  - `bg-[#18191e]` / `bg-[#121316]` (Elevated Containers): Kartu & tabel dengan permukaan matte natural.
  - `border-[#262830]` / `border-[#2a2c35]`: Garis batas flat 1px yang halus dan tegas.
- **Natural Semantic Status Tones:**
  - **Healthy / Safe (Natural Forest Green):** `bg-emerald-600` (`#16a34a`) / `text-emerald-400` pada kontainer `#142e1f` untuk status margin aman & aksi utama.
  - **Warning / Thin Margin (Warm Ochre Amber):** `bg-amber-600` (`#d97706`) / `text-amber-400` pada kontainer `#3d2612` untuk margin tipis ($<15\%$).
  - **Critical / Danger / Loss (Warm Terracotta Red):** `bg-red-600` (`#dc2626`) / `text-red-400` pada kontainer `#3b181b` untuk bahaya jual rugi boncos ($<5\%$).
  - **Neutral / Text:** `#f3f4f6` (Warm Off-White) untuk judul & nominal utama, `#d1d5db` untuk isi, dan `#9ca3af` untuk label sekunder.

## Typography & Hierarchy

- **Font Family:** *Plus Jakarta Sans*, *Inter*, sans-serif.
- **Feature Settings:** `font-feature-settings: "cv02", "cv03", "cv04", "cv11", "tnum"` untuk memastikan seluruh angka Rupiah dan persentase sejajar (*tabular numerals*).
- **Scale:**
  - `text-2xl` / `text-3xl font-bold`: Nominal harga rekomendasi utama.
  - `text-sm font-bold`: Nama produk dan judul kartu.
  - `text-xs font-semibold`: Label harga modal dan harga rak.
  - `text-[10px]` / `text-[11px] font-medium`: Metadata tanggal, kategori, dan subtotal.

## Accessibility & Multi-Generational Inclusivity

- **Dynamic Text Magnifier (`.easy-mode`):** Pembesaran skala teks 114% dengan 1-klik toggle di header untuk pengguna senior.
- **Touch Targets:** Minimal tinggi $48\text{px}-52\text{px}$ untuk seluruh tombol aksi dan navigasi bawah.
- **Triple-Redundancy Status:** Seluruh status bahaya/untung dilengkapi dengan **Warna Alami + Ikon Vektor + Teks Eksplisit Bahasa Indonesia**.
- **Plain Human Language:** Menggunakan kalimat nyata (*"Untung Rp 500/barang"*) mendampingi persentase matematis (*"Margin 15.0%"*).

## Layout & Components

- **Mobile-First Shell:** `max-w-md` terpusat di layar desktop.
- **Flat Surface Cards:** Sudut lengkung natural $\le 12\text{px}-16\text{px}$ (`rounded-lg` / `rounded-xl`), border 1px matte, zero-blur halo.
- **Bottom Navigation:** 5 tab esensial dengan label teks yang selalu terlihat (*Scan Rak, Scan Nota, Katalog, Riwayat, Setelan*).
- **No-AI Slop Rules:** Tanpa kickers/eyebrows kapital berulang, tanpa gradien teks pudar, tanpa emoji pengganti ikon, tanpa efek neon berlebihan.



# Task: Implement Design System from design.md to Code
I have provided `design.md` containing the "Utilitarian Flat Dark" system. 
DO NOT deviate from these tokens. DO NOT add gradients, shadows, or neon effects.

# Strict Implementation Rules

## 1. Tailwind Config Extension
Extend `tailwind.config.js` EXACTLY with these tokens. Do not use default Tailwind colors for surfaces.
- Colors: Map `warm-charcoal`, `forest-green`, `ochre-amber`, `terracotta-red` exactly as defined in design.md hex codes.
- Font: Set 'Plus Jakarta Sans' as default. Enable `tabular-nums` globally for all `p`, `span`, `div` containing currency/percentages.

## 2. Component Constraints (Mobile First)
- **Cards**: Background `#18191e`, Border `#262830` (1px solid). Radius `rounded-xl` (12px). NO box-shadow blur, use border only for depth.
- **Buttons**: Height MIN 52px. Font weight `font-bold`. Text color MUST contrast 4.5:1 against button background. 
- **Status Badges**: Use "Triple-Redundancy": 
  1. Background color (e.g., `#142e1f` for green).
  2. Icon (Vector, filled).
  3. Text Label (e.g., "Aman", "Bahaya").
  NO status indicated by color alone.

## 3. Accessibility Features
- **Easy Mode Toggle**: Implement a global context/state `.easy-mode`. When active, scale base font-size by 1.14 (114%). Ensure layout does not break (use relative units `rem`).
- **Touch Targets**: Verify all `button`, `a`, `input` have min-height 52px and min-width 48px.
- **Language**: All UI text MUST be plain Indonesian (e.g., "Untung Rp 500", not "Margin Positive").

## 4. No-AI Slop Enforcement
- REJECT any CSS `background-image: linear-gradient(...)`.
- REJECT any `backdrop-filter: blur(...)`.
- REJECT any emoji usage. Use Lucide/Heroicons SVG only.
- REJECT any text-transform: uppercase for body content.

# Output
Generate the `DashboardMobile.tsx` component using these tokens. 
Structure: 
1. Header (with Easy Mode Toggle).
2. Main KPI Card (Big Number, Tabular).
3. Alert List (Flat Cards).
4. Bottom Nav (Fixed, 5 items).   