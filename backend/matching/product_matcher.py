"""
2-Stage Text Matching:
  Stage 1: RapidFuzz  — cepat, token-based
  Stage 2: Semantic   — pakai model fine-tuned kita
"""
from rapidfuzz import fuzz, process
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import Optional, Tuple
import os

class ProductMatcher:
    FUZZY_THRESHOLD    = 72    # Stage 1 minimum (0–100)
    SEMANTIC_THRESHOLD = 0.70  # Stage 2 minimum (0–1)

    def __init__(self, model_path: str = "models/marginku-product-matcher"):
        if os.path.exists(model_path):
            print(f"  ✅ Fine-tuned model loaded: {model_path}")
            self.model = SentenceTransformer(model_path)
        else:
            print("  ⚠️  Fine-tuned model tidak ada, pakai base model")
            self.model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

        self._names: list[str] = []
        self._embeddings = None

    def load_catalog(self, product_names: list[str]):
        """Pre-compute embeddings katalog. Panggil tiap kali katalog berubah."""
        self._names = product_names
        if product_names:
            self._embeddings = self.model.encode(product_names)

    def find_match(self, query: str) -> Tuple[Optional[str], float, str]:
        """
        Returns: (nama_cocok, skor, stage)
        stage: "fuzzy" | "semantic" | "no_match" | "no_catalog"
        """
        if not self._names:
            return None, 0.0, "no_catalog"

        # Stage 1: RapidFuzz
        result = process.extractOne(
            query, self._names, scorer=fuzz.token_sort_ratio
        )
        if result and result[1] >= self.FUZZY_THRESHOLD:
            return result[0], round(result[1] / 100.0, 3), "fuzzy"

        # Stage 2: Semantic (model fine-tuned)
        q_emb  = self.model.encode([query])
        sims   = cosine_similarity(q_emb, self._embeddings)[0]
        best_i = int(np.argmax(sims))
        best_s = float(sims[best_i])

        if best_s >= self.SEMANTIC_THRESHOLD:
            return self._names[best_i], round(best_s, 3), "semantic"

        return None, round(best_s, 3), "no_match"

# ── Test ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    m = ProductMatcher()
    catalog = [
        "Indomie Goreng Ayam 85gr",
        "Sabun Lifebuoy Merah 85gr",
        "Minyak Goreng Bimoli 1L",
        "Aqua Galon 19L",
        "Gula Pasir Rose Brand 1kg",
    ]
    m.load_catalog(catalog)

    queries = [
        ("Mie Goreng Indomie",   "Indomie Goreng Ayam 85gr"),
        ("Lifebuoy Batang",      "Sabun Lifebuoy Merah 85gr"),
        ("Bimoli 1 Liter",       "Minyak Goreng Bimoli 1L"),
        ("Barang Tidak Ada XYZ", None),
    ]

    print(f"\n  {'Query':<25} {'Cocok':<30} {'Skor':>6}  Stage")
    print("  " + "-" * 70)
    for q, expected in queries:
        match, score, stage = m.find_match(q)
        status = "✅" if match == expected else ("✅" if match is None and expected is None else "❌")
        match_str = match or "❌ tidak cocok"
        print(f"  {q:<25} {match_str:<30} {score:>6.3f}  {status} {stage}")
