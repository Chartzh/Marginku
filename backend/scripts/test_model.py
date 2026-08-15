"""
Bandingkan model base vs model fine-tuned.
"""
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

print("Loading models (tunggu sebentar)...")
model_base = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
model_ft   = SentenceTransformer("models/marginku-product-matcher")

test_cases = [
    ("Indomie Goreng Ayam 85gr",  "Mie Goreng Indomie",          "✅ sama"),
    ("Sabun Lifebuoy Merah 85gr", "Lifebuoy Batang",             "✅ sama"),
    ("Minyak Goreng Bimoli 1L",   "Bimoli 1 Liter",              "✅ sama"),
    ("Royco Bumbu Ayam",          "Royco Ayam Sachet",           "✅ sama"),
    ("Aqua Galon 19L",            "Sprite 1.5L",                 "❌ beda"),
    ("Indomie Goreng",            "Sabun Lifebuoy",              "❌ beda"),
    ("Gula Pasir Rose Brand",     "Minyak Goreng Tropical",      "❌ beda"),
]

print(f"\n{'Teks 1':<32} {'Teks 2':<30} {'Base':>6} {'Fine-tuned':>10}  Harapan")
print("-" * 90)
for t1, t2, label in test_cases:
    def sim(m, a, b):
        return cosine_similarity(m.encode([a]), m.encode([b]))[0][0]
    s_base = sim(model_base, t1, t2)
    s_ft   = sim(model_ft,   t1, t2)
    improved = "⬆️" if (label == "✅ sama" and s_ft > s_base) or \
                       (label == "❌ beda" and s_ft < s_base) else "➡️"
    print(f"{t1:<32} {t2:<30} {s_base:>6.3f} {s_ft:>10.3f}  {improved} {label}")
