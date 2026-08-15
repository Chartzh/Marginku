"""
Semua kalkulasi margin & harga menggunakan Python murni.
TIDAK ADA LLM yang terlibat di sini — sesuai prinsip project.
"""
import math
from dataclasses import dataclass
from typing import Literal

MarginStatus = Literal["aman", "tipis", "bahaya"]

@dataclass
class MarginResult:
    nama_produk: str
    harga_modal: float
    harga_rak: float
    margin_persen: float
    status: MarginStatus
    harga_rekomendasi: float
    keuntungan_per_item: float
    perlu_update: bool

def hitung_margin(harga_rak: float, harga_modal: float) -> float:
    """Margin Aktif (%) = ((Harga Rak - Harga Modal) / Harga Rak) * 100"""
    if harga_rak <= 0:
        return 0.0
    return ((harga_rak - harga_modal) / harga_rak) * 100

def target_harga(harga_modal: float, target_margin_persen: float = 20.0) -> float:
    """Target Price = Harga Modal / (1 - Target Margin)"""
    if target_margin_persen >= 100:
        raise ValueError("Target margin tidak boleh >= 100%")
    return harga_modal / (1 - target_margin_persen / 100)

def rupiah_rounding(harga: float) -> int:
    """
    Bulatkan ke atas ke kelipatan Rp500 atau Rp1.000.
    Aturan: < Rp10.000 → kelipatan Rp500, >= Rp10.000 → kelipatan Rp1.000
    """
    if harga < 10_000:
        return math.ceil(harga / 500) * 500
    else:
        return math.ceil(harga / 1_000) * 1_000

def tentukan_status(margin_persen: float) -> MarginStatus:
    """Klasifikasi status margin."""
    if margin_persen >= 15.0:
        return "aman"
    elif margin_persen >= 5.0:
        return "tipis"
    else:
        return "bahaya"

def analisis_produk(
    nama: str,
    harga_modal: float,
    harga_rak: float,
    target_margin: float = 20.0
) -> MarginResult:
    """Fungsi utama: analisis lengkap satu produk."""
    margin = hitung_margin(harga_rak, harga_modal)
    status = tentukan_status(margin)
    perlu_update = margin < 15.0
    
    if perlu_update:
        harga_raw = target_harga(harga_modal, target_margin)
        harga_rek = rupiah_rounding(harga_raw)
    else:
        harga_rek = harga_rak
    
    return MarginResult(
        nama_produk=nama,
        harga_modal=harga_modal,
        harga_rak=harga_rak,
        margin_persen=round(margin, 2),
        status=status,
        harga_rekomendasi=harga_rek,
        keuntungan_per_item=round(harga_rek - harga_modal, 0),
        perlu_update=perlu_update
    )

# --- Test saat file dijalankan langsung ---
if __name__ == "__main__":
    kasus = [
        ("Indomie Goreng",   2_800,  3_000),  # margin tipis
        ("Sabun Lifebuoy",   4_500,  5_000),  # margin tipis
        ("Aqua Galon",      18_000, 22_000),  # aman
        ("Minyak Goreng",   14_000, 14_200),  # BAHAYA rugi
    ]
    
    print(f"\n{'Produk':<20} {'Modal':>8} {'Rak':>8} {'Margin':>8} "
          f"{'Status':<8} {'Rekomendasi':>12} {'Untung/item':>12}")
    print("-" * 82)
    for nama, modal, rak in kasus:
        r = analisis_produk(nama, modal, rak)
        icon = {"aman": "🟢", "tipis": "🟡", "bahaya": "🔴"}[r.status]
        print(f"{r.nama_produk:<20} {r.harga_modal:>8,.0f} {r.harga_rak:>8,.0f} "
              f"{r.margin_persen:>7.1f}% {icon}{r.status:<7} "
              f"{r.harga_rekomendasi:>12,.0f} {r.keuntungan_per_item:>12,.0f}")
