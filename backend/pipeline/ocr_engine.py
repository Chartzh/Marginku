"""
OCR Engine menggunakan Gemini 3.6 Flash Vision.
Scan foto nota supplier atau label harga rak.
"""
import google.generativeai as genai
from PIL import Image
import json, re, os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

PROMPT_NOTA = """
Kamu adalah OCR khusus nota/struk supplier warung kelontong Indonesia.

Ekstrak SEMUA item dari foto nota ini.
Kembalikan HANYA JSON valid (tanpa teks lain, tanpa markdown code block).

Format:
{
  "items": [
    {
      "nama": "nama produk PERSIS seperti di nota, termasuk ukuran",
      "harga_satuan": 2800,
      "jumlah": 10,
      "total": 28000
    }
  ],
  "supplier": "nama supplier atau null",
  "tanggal": "DD/MM/YYYY atau null"
}

Aturan:
- harga_satuan dan total harus integer Rupiah (tanpa titik/koma)
- jumlah default 1 kalau tidak tercantum
- Kalau tidak terbaca dengan jelas, isi null
"""

PROMPT_LABEL = """
Kamu adalah OCR khusus label harga rak warung kelontong Indonesia.

Ekstrak info harga dari foto label/price tag ini.
Kembalikan HANYA JSON valid (tanpa teks lain, tanpa markdown code block).

Format:
{
  "nama": "nama produk di label",
  "harga_jual": 3500,
  "keterangan": "info tambahan atau null"
}

Aturan:
- harga_jual harus integer Rupiah
- Ambil harga yang paling menonjol/besar di label
"""

class OCREngine:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-3.6-flash")

    def _parse_response(self, text: str) -> dict:
        """Bersihkan response Gemini dan parse JSON-nya."""
        text = text.strip()
        # Hapus markdown code block kalau ada
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return json.loads(text)

    def _call(self, image_path: str, prompt: str) -> dict:
        img = Image.open(image_path)
        resp = self.model.generate_content([prompt, img])
        return self._parse_response(resp.text)

    def scan_nota(self, image_path: str) -> dict:
        """Scan foto nota supplier → daftar produk + harga modal."""
        return self._call(image_path, PROMPT_NOTA)

    def scan_label_rak(self, image_path: str) -> dict:
        """Scan foto label harga rak → nama produk + harga jual."""
        return self._call(image_path, PROMPT_LABEL)

# ── Test ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    from PIL import ImageDraw
    import os

    os.makedirs("data/test_images", exist_ok=True)

    # Buat gambar nota dummy
    img = Image.new("RGB", (420, 280), "white")
    draw = ImageDraw.Draw(img)
    draw.multiline_text((15, 15), (
        "NOTA - CV SUMBER JAYA\n"
        "==============================\n"
        "Indomie Goreng 85gr\n"
        "  12 x Rp2.800 = Rp33.600\n"
        "Sabun Lifebuoy 85gr\n"
        "   6 x Rp4.500 = Rp27.000\n"
        "Bimoli 1L\n"
        "   4 x Rp16.000 = Rp64.000\n"
        "==============================\n"
        "TOTAL = Rp124.600"
    ), fill="black", spacing=6)
    path = "data/test_images/nota_dummy.jpg"
    img.save(path)

    print("Testing OCR dengan nota dummy...")
    engine = OCREngine()
    try:
        result = engine.scan_nota(path)
        print("✅ Hasil scan:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"❌ Error: {e}")
        print("   Cek GEMINI_API_KEY di file .env")
