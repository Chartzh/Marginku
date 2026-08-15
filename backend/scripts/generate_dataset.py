import pandas as pd
import os

os.makedirs("data", exist_ok=True)

# ============================================================
# POSITIVE PAIRS: nama produk SAMA, tapi penulisan BERBEDA
# Tambah terus dari foto nota & label rak yang dikumpulkan Member 3
# ============================================================
positive_pairs = [
    ("Indomie Goreng Ayam 85gr", "Mie Goreng Indomie", 1),
    ("Indomie Kuah Soto 70gr", "Indomie Soto Ayam", 1),
    ("Mie Sedaap Goreng 87gr", "Sedaap Goreng", 1),
    ("Mie Sedaap Kuah Ayam Bawang", "Sedaap Ayam Bawang", 1),
    ("Sabun Lifebuoy Merah 85gr", "Lifebuoy Sabun Batang", 1),
    ("Sabun Mandi Dettol 85gr", "Dettol Sabun Batang Antiseptik", 1),
    ("Minyak Goreng Bimoli 1L", "Bimoli 1 Liter", 1),
    ("Minyak Goreng Tropical 2L", "Tropical 2 Liter", 1),
    ("Aqua Galon 19L", "Air Galon Aqua 19L", 1),
    ("Teh Botol Sosro 450ml", "Sosro Teh Botol 450ml", 1),
    ("Sprite 1.5L", "Sprite Besar 1.5 Liter", 1),
    ("Coca Cola 390ml", "Coke 390ml", 1),
    ("Rinso Deterjen Bubuk 1kg", "Deterjen Rinso 1kg", 1),
    ("So Klin Bubuk 900gr", "Soklin 900gr", 1),
    ("Sunlight Pencuci Piring 200ml", "Sunlight 200ml Jeruk Nipis", 1),
    ("Kecap Manis ABC 135ml", "ABC Kecap 135ml", 1),
    ("Kecap Bango Manis 135ml", "Bango Kecap Manis", 1),
    ("Rokok Sampoerna Mild 12", "Sampoerna 12s", 1),
    ("Susu Frisian Flag Full Cream 1L", "Frisian Flag 1 Liter FC", 1),
    ("Susu UHT Ultra Milk 250ml", "Ultra Milk 250ml", 1),
    ("Gula Pasir Rose Brand 1kg", "Rose Brand 1kg", 1),
    ("Tepung Terigu Segitiga Biru 1kg", "Bogasari Segitiga Biru 1kg", 1),
    ("Pocari Sweat 500ml", "Pocari 500ml Isotonic", 1),
    ("Biskuit Roma Marie 150gr", "Roma Marie Gold 150gr", 1),
    ("Shampoo Pantene 170ml", "Pantene Shampo 170ml", 1),
    ("Odol Pepsodent 75gr", "Pasta Gigi Pepsodent 75gr", 1),
    ("Odol Close Up 100gr", "Close Up Pasta Gigi", 1),
    ("Royco Bumbu Ayam Sachet 7gr", "Royco Ayam 7gr", 1),
    ("Masako Bumbu Sapi Sachet", "Masako Sapi", 1),
    ("Kopi Kapal Api 165gr", "Kapal Api Special 165gr", 1),
    ("Good Day Cappuccino Sachet", "Good Day Cappuccino", 1),
    ("Teh Celup Sariwangi 50 pcs", "Sariwangi 50s", 1),
    ("Energen Sereal Coklat 10pcs", "Energen Cokelat 10 sachet", 1),
    ("Pop Mie Ayam 75gr", "Pop Mie Cup Ayam", 1),
    ("Chitato Sapi Panggang 68gr", "Chitato Beef BBQ", 1),
    ("Permen Kopiko 175gr", "Kopiko Candy 175gr", 1),
    ("Baygon Semprot 600ml", "Baygon 600ml Lavender", 1),
    ("Pembalut Charm 8pcs", "Charm Pembalut 8 lembar", 1),
    ("Betadine 30ml", "Betadine Antiseptik 30ml", 1),
    ("Minyak Kayu Putih Cap Lang 30ml", "Cap Lang 30ml", 1),
]

# ============================================================
# NEGATIVE PAIRS: produk yang BERBEDA (jangan salah cocok!)
# ============================================================
negative_pairs = [
    ("Indomie Goreng Ayam 85gr", "Minyak Goreng Bimoli 1L", 0),
    ("Sabun Lifebuoy Merah 85gr", "Susu Frisian Flag Full Cream 1L", 0),
    ("Aqua Galon 19L", "Sprite 1.5L", 0),
    ("Teh Botol Sosro 450ml", "Pocari Sweat 500ml", 0),
    ("Rinso Deterjen Bubuk 1kg", "Gula Pasir Rose Brand 1kg", 0),
    ("Kecap Manis ABC 135ml", "Shampoo Pantene 170ml", 0),
    ("Mie Sedaap Goreng 87gr", "Biskuit Roma Marie 150gr", 0),
    ("Gula Pasir Rose Brand 1kg", "Sabun Mandi Dettol 85gr", 0),
    ("Odol Pepsodent 75gr", "Tepung Terigu Segitiga Biru 1kg", 0),
    ("Rokok Sampoerna Mild 12", "Aqua Galon 19L", 0),
    ("Susu UHT Ultra Milk 250ml", "Minyak Goreng Tropical 2L", 0),
    ("Pop Mie Ayam 75gr", "Betadine 30ml", 0),
    ("Energen Sereal Coklat 10pcs", "Baygon Semprot 600ml", 0),
    ("Kopi Kapal Api 165gr", "Pembalut Charm 8pcs", 0),
    ("Royco Bumbu Ayam Sachet 7gr", "Coca Cola 390ml", 0),
    ("Chitato Sapi Panggang 68gr", "Minyak Kayu Putih Cap Lang 30ml", 0),
    ("Permen Kopiko 175gr", "So Klin Bubuk 900gr", 0),
    ("Biskuit Roma Marie 150gr", "Masako Bumbu Sapi Sachet", 0),
    ("Good Day Cappuccino Sachet", "Rinso Deterjen Bubuk 1kg", 0),
    ("Teh Celup Sariwangi 50 pcs", "Odol Close Up 100gr", 0),
]

all_pairs = positive_pairs + negative_pairs
df = pd.DataFrame(all_pairs, columns=["sentence1", "sentence2", "label"])
df.to_csv("data/training_pairs.csv", index=False)

print(f"✅ Dataset dibuat!")
print(f"   Total pasangan : {len(df)}")
print(f"   Positive pairs : {len(positive_pairs)}")
print(f"   Negative pairs : {len(negative_pairs)}")
print(f"\nPreview:")
print(df.head(5).to_string())
