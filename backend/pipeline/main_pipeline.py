from pipeline.ocr_engine import OCREngine
from matching.product_matcher import ProductMatcher
from pipeline.math_engine import analisis_produk, MarginResult

class ProductDatabase:
    def __init__(self):
        self.items: dict[str, float] = {}  # {nama: harga_modal}

    def tambah_dari_nota(self, nota_result: dict):
        for item in nota_result.get("items", []):
            if item.get("nama") and item.get("harga_satuan"):
                self.items[item["nama"]] = float(item["harga_satuan"])

    def daftar_nama(self) -> list[str]:
        return list(self.items.keys())

class MarginPipeline:
    def __init__(self):
        self.ocr     = OCREngine()
        self.matcher = ProductMatcher()
        self.db      = ProductDatabase()

    def proses_nota(self, image_path: str) -> dict:
        result = self.ocr.scan_nota(image_path)
        self.db.tambah_dari_nota(result)
        self.matcher.load_catalog(self.db.daftar_nama())
        return {
            "status": "success",
            "items_ditambahkan": len(result.get("items", [])),
            "total_katalog": len(self.db.items),
            "detail": result
        }

    def audit_label_rak(self, image_path: str, target_margin: float = 20.0) -> dict:
        label = self.ocr.scan_label_rak(image_path)
        nama_label = label.get("nama", "")
        harga_rak  = label.get("harga_jual", 0)

        if not nama_label or not harga_rak:
            return {"status": "error", "pesan": "Gagal baca label rak"}

        cocok, skor, stage = self.matcher.find_match(nama_label)
        if not cocok:
            return {
                "status": "not_found",
                "nama_label": nama_label,
                "harga_rak": harga_rak,
                "pesan": f"'{nama_label}' tidak ditemukan di database nota"
            }

        harga_modal = self.db.items[cocok]
        r = analisis_produk(nama_label, harga_modal, harga_rak, target_margin)

        icon = {"aman": "✅", "tipis": "⚡", "bahaya": "🚨"}[r.status]
        if r.status == "bahaya":
            pesan = (f"🚨 RUGI! Margin {r.margin_persen:.1f}%. "
                     f"Naikkan harga ke Rp{r.harga_rekomendasi:,.0f} "
                     f"→ untung Rp{r.keuntungan_per_item:,.0f}/barang.")
        elif r.status == "tipis":
            pesan = (f"⚡ Margin {r.margin_persen:.1f}% tipis. "
                     f"Disarankan naikkan ke Rp{r.harga_rekomendasi:,.0f}.")
        else:
            pesan = f"✅ Margin {r.margin_persen:.1f}% — harga rak sudah oke."

        return {
            "status": "success",
            "nama_label_rak":   nama_label,
            "nama_di_nota":     cocok,
            "match_score":      skor,
            "match_stage":      stage,
            "harga_modal":      harga_modal,
            "harga_rak":        harga_rak,
            "margin_persen":    r.margin_persen,
            "status_margin":    r.status,
            "perlu_update_harga": r.perlu_update,
            "harga_rekomendasi": r.harga_rekomendasi,
            "keuntungan_per_item": r.keuntungan_per_item,
            "pesan": pesan,
        }
