"""
Fine-tune sentence-transformer untuk pencocokan nama produk warung Indonesia.
Kompatibel dengan sentence-transformers v5.7.0 + transformers v5+
"""

# ── Semua import pakai path baru (tidak ada DeprecationWarning) ────────────
from sentence_transformers import SentenceTransformer
from sentence_transformers.sentence_transformer.trainer import SentenceTransformerTrainer
from sentence_transformers.sentence_transformer.training_args import SentenceTransformerTrainingArguments
from sentence_transformers.sentence_transformer.losses import CosineSimilarityLoss
from datasets import Dataset
import pandas as pd
import os

# ── Konfigurasi ────────────────────────────────────────────────────────────
BASE_MODEL  = "paraphrase-multilingual-MiniLM-L12-v2"
OUTPUT_PATH = "models/marginku-product-matcher"
DATA_PATH   = "data/training_pairs.csv"
EPOCHS      = 15
BATCH_SIZE  = 8

print("=" * 55)
print("  Marginku — Fine-tune Product Matching Model")
print("  sentence-transformers v5.7.0 + transformers v5+")
print("=" * 55)

# ── 1. Load base model ─────────────────────────────────────────────────────
print(f"\n[1/4] Loading base model: {BASE_MODEL}")
model = SentenceTransformer(BASE_MODEL)

# ── 2. Load & format dataset ───────────────────────────────────────────────
print(f"[2/4] Loading training data: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
n_pos = int(df["label"].sum())
n_neg = int((df["label"] == 0).sum())
print(f"      Total: {len(df)} pairs ({n_pos} positive, {n_neg} negative)")

train_dataset = Dataset.from_dict({
    "sentence1": df["sentence1"].tolist(),
    "sentence2": df["sentence2"].tolist(),
    "label":     df["label"].astype(float).tolist(),
})

# ── 3. Loss function ───────────────────────────────────────────────────────
train_loss = CosineSimilarityLoss(model)

# ── 4. Training Arguments ──────────────────────────────────────────────────
os.makedirs(OUTPUT_PATH, exist_ok=True)

# Hitung warmup_steps sebagai float (ratio 0.1 = 10% dari total steps)
# transformers v5+ tidak pakai warmup_ratio lagi, pakai warmup_steps float
total_steps = (len(train_dataset) // BATCH_SIZE + 1) * EPOCHS
warmup = round(total_steps * 0.1, 2)

args = SentenceTransformerTrainingArguments(
    output_dir=OUTPUT_PATH,
    num_train_epochs=EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    warmup_steps=warmup,       # float — bukan warmup_ratio
    save_strategy="epoch",
    logging_steps=5,
    use_cpu=True,              # Paksa CPU, tidak perlu GPU
)

# ── 5. Trainer + Training ──────────────────────────────────────────────────
trainer = SentenceTransformerTrainer(
    model=model,
    args=args,
    train_dataset=train_dataset,
    loss=train_loss,
)

print(f"[3/4] Training {EPOCHS} epochs (~5-10 menit di CPU)...")
trainer.train()

# ── 6. Simpan model final ──────────────────────────────────────────────────
model.save(OUTPUT_PATH)
print(f"\n[4/4] ✅ Model tersimpan di: {OUTPUT_PATH}/")

# ── 7. Sanity test ─────────────────────────────────────────────────────────
print("\nSanity test hasil fine-tuning:")
from sklearn.metrics.pairwise import cosine_similarity

tests = [
    ("Indomie Goreng Ayam 85gr", "Mie Goreng Indomie",  True,  "sama"),
    ("Sabun Lifebuoy Merah",     "Lifebuoy Batang",      True,  "sama"),
    ("Minyak Goreng Bimoli 1L",  "Bimoli 1 Liter",       True,  "sama"),
    ("Aqua Galon 19L",           "Sprite 1.5L",           False, "beda"),
    ("Indomie Goreng",           "Sabun Lifebuoy",        False, "beda"),
]

print(f"\n  {'Query':<30} {'Kandidat':<28} {'Skor':>6}  Check")
print("  " + "-" * 72)
for t1, t2, harus_mirip, label in tests:
    e1    = model.encode([t1])
    e2    = model.encode([t2])
    score = float(cosine_similarity(e1, e2)[0][0])
    if harus_mirip:
        ok = "✅" if score > 0.65 else "⚠️  score rendah"
    else:
        ok = "✅" if score < 0.55 else "⚠️  score tinggi"
    arah = "↑" if harus_mirip else "↓"
    print(f"  {t1:<30} {t2:<28} {score:>6.4f}  {ok} ({arah} {label})")

print("\n✅ Selesai! Lanjut: python scripts/test_model.py")
